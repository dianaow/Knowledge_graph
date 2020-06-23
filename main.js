let width = screen.width - 360
let height = screen.height - 180
let clicked = false

// set node, link, text color and dimensions
const childRadius = 5
const nodeStrokeWidth = 2
const nodeOpacity = 1
const nodeTextOpacity = 0.8
const childnodeTextOpacity = 0
const nodeTextSize = 12
const nodeFill = "#f5f5f5"
const nodeTextFill = "gray"

const linkStrokeWidth = 2
const linkOpacity = 1
const linkTextOpacity = 0
const linkTextSize = 8
const transitionDuration = 750
const linkStroke = "gray"

const nodeRadiusScale = d3.scaleSqrt().domain([5, 150]).range([3, 25])

const linkWidthScale = d3.scaleSqrt().domain([5, 500]).range([2.5, 25])

const linkOpacityScale = d3.scaleSqrt().domain([5, 250]).range([0.25, 1])

const colorScale = d3
  .scaleOrdinal()
  .range(["#E10100", "#00bcd4", "#3f51b5"])
  .domain(["author", "categories", "keywords"])

const linkedByIndex = []

const simulation = d3.forceSimulation().force(
  "link",
  d3.forceLink()
    // .distance(function (d) {
    //   return d.distance
    // })
    .strength(function (d) {
      return d.strength
    })
)

function networkLayout({ ...data }) {
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("class", "networkWrapper")
    .attr("width", width)
    .attr("height", height)

  const g = svg.append("g").attr("class", "network")

  g.append("g").attr("class", "links")

  g.append("g").attr("class", "nodes")

  updateGraph(data)

  showInitCard(data)

  var zoom = d3.zoom().on("zoom", zoomed)

  svg.call(zoom).on("dblclick.zoom", null)

  function zoomed() {
    g.attr("transform", d3.event.transform)
  }

  d3.select(".zoom-in").on("click", function () {
    zoom.scaleBy(svg.transition().duration(350), 1.2)
  })

  d3.select(".zoom-out").on("click", function () {
    zoom.scaleBy(svg.transition().duration(350), 0.8)
  })

  d3.select(".refresh").on("click", function () {
    svg
      .transition()
      .duration(350)
      .call(zoom.transform, d3.zoomIdentity)
    showInitCard(data)
  })

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Graph Network: Create node and link elements ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function draw(nodes, links, accessors, summary) {
    function nodeKey(n) {
      return n.id
    }
    function linkKey(d) {
      return d.source.id + "-" + d.target.id
    }

    let { root } = accessors
    let graphNodesGroup = d3.select("#chart").select(".nodes")
    let graphLinksGroup = d3.select("#chart").select(".links")

    // DRAW NODES
    let graphNodesData = graphNodesGroup
      .selectAll("g")
      .data(nodes, (d) => nodeKey(d))

    graphNodesData
      .exit()
      .select("circle")
      .transition()
      .duration(transitionDuration)
      .attr("r", 0)
      .remove()

    graphNodesData.exit().select("text").remove()

    graphNodesData.exit().transition().duration(transitionDuration).remove()

    let graphNodesEnter = graphNodesData
      .enter()
      .append("g")
      .attr("class", "node-group")
      .attr("id", (d) => "node-group-" + nodeKey(d))
      .on("dblclick", releasenode)
      .call(
        d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
      )

    graphNodesEnter
      .append("circle")
      .attr("class", "node node-circle")
      .attr("r", (d) => d.radius)
      .attr("id", function (d) {
        return "node-" + d.id
      })
      .attr("stroke-width", function (d) {
        return d.strokeWidth
      })
      .attr("stroke", function (d) {
        return d.strokeColor
      })
      .attr("opacity", function (d) {
        return d.opacity
      })
      .attr("fill", function (d) {
        return d.color
      })

    // DRAW NODE LABELS
    let textChildrenNode = graphNodesEnter.filter((d) => !root(d))

    textChildrenNode
      .append("text")
      .attr("class", "node-label")
      .attr("font-size", `${nodeTextSize}px`)
      .attr("font-weight", 900)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => d.color)
      .attr("opacity", nodeTextOpacity)
      .attr("x", (d) => 0)
      .attr("y", (d) => -d.radius - 8)
      .text((d) => `${d.id}`)

    let textRootNode = graphNodesEnter.filter((d) => root(d))

    textRootNode
      .append("text")
      .attr("class", "root-label")
      .attr("font-size", `${nodeTextSize * 1.25}px`)
      .attr("font-weight", 600)
      .attr("text-anchor", "middle")
      .attr("fill", nodeTextFill)
      .attr("opacity", 1)
      .attr("x", (d) => 0)
      .attr("y", (d) => -d.radius - 10)
      .text((d) => `${d.id}`)
      .call(getBB)

    textRootNode
      .insert("rect", "text")
      .attr("class", "bbox-label")
      .attr("x", (d) => d.bbox.x)
      .attr("y", (d) => -d.radius - 10 - 15)
      .attr("width", function (d) {
        return d.bbox.width
      })
      .attr("height", function (d) {
        return d.bbox.height
      })
      .attr("fill", nodeFill)
      .attr("opacity", 0.8)

    function getBB(selection) {
      selection.each(function (d) {
        d.bbox = this.getBBox()
      })
    }
    graphNodesData = graphNodesEnter.merge(graphNodesData)

    graphNodesData.selectAll(".node-circle").call(function (node) {
      node
        .transition()
        .attr("r", (d) => d.radius)
        .attr("fill", (d) => d.color)
        .attr("stroke", (d) => d.strokeColor)
    })

    graphNodesData
      .selectAll(".node")
      .attr('cursor', 'pointer')
      .on("mouseover", (d) => hoverOver(d))
      .on("mouseout", () => hoverOut())

    // DRAW LINKS
    let graphLinksData = graphLinksGroup
      .selectAll("g")
      .data(links, (d) => linkKey(d))

    graphLinksData
      .exit()
      .select("path")
      .transition()
      .duration(transitionDuration)
      .attr("opacity", 0)
      .remove()

    graphLinksData.exit().transition().duration(transitionDuration).remove()

    let graphLinksEnter = graphLinksData
      .enter()
      .append("g")
      .attr("id", (d) => "path-group-" + linkKey(d))

    graphLinksEnter
      .append("path")
      .attr("class", "link")
      .attr("id", function (d) {
        return "path-" + linkKey(d)
      })
      .attr("marker-mid", "url(#arrowhead)")
      .attr("stroke-width", function (d) {
        return d.strokeWidth
      })
      .attr("stroke", function (d) {
        return d.strokeColor
      })
      .attr("opacity", (d) => d.opacity)

    graphLinksData = graphLinksEnter.merge(graphLinksData)

    graphLinksData
      .selectAll(".link")
      .transition()
      .duration(transitionDuration)
      .attr("opacity", (d) => d.opacity)

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////// Graph Network: Create interactivity ///////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    d3.select(".fold-button-div").on("click", function () {
      clicked = !clicked
      d3.select(".abstractbox-column").classed("folded", clicked)
      d3.select(".fa-caret-right").style("display", clicked ? "none" : "block")
      d3.select(".fa-caret-left").style("display", clicked ? "block" : "none")
      d3.select(".networkWrapper").attr(
        "width",
        clicked ? screen.width : screen.width - 360
      )
    })

    const input = document.querySelector(".search-component input")

    input.addEventListener("keyup", function (event) {
      if (event.keyCode === 13) {
        event.preventDefault()
        let selected = nodes.find((d) => d.id === input.value)
        if (selected) {
          hoverOver(selected)
        }
      }
    })

    function hoverOver(d) {
      let hoverAttr = {
        hover_textOpacity: 0,
        hover_strokeOpacity: 0.2,
        hover_arrow: "url(#arrowhead)",
      }
      highlightConnections(graphNodesData, graphLinksData, d, hoverAttr)

      if (d.category === "author") {
        showTooltip(d, links, summary)
      }
    }

    function hoverOut() {
      unhighlightConnections(graphNodesData, graphLinksData)
      //d3.select('#tooltip')
      //.attr('visibility', 'hidden')
    }

    function highlightConnections(graphNodesData, graphLinksData, d, hoverAttr) {
      const { hover_textOpacity, hover_strokeOpacity, hover_arrow } = hoverAttr

      function isConnected(a, b) {
        return (
          linkedByIndex[`${a.id},${b.id}`] ||
          linkedByIndex[`${b.id},${a.id}`] ||
          a.id === b.id
        )
      }

      graphNodesData
        .selectAll(".node")
        .attr("opacity", (o) => (isConnected(d, o) ? 1 : hover_strokeOpacity))
        .style("pointer-events", (o) => (isConnected(d, o) ? "auto" : "none"))

      graphNodesData
        .selectAll(".bbox-label")
        .attr("opacity", (o) => (isConnected(d, o) ? 1 : 0))

      graphNodesData
        .selectAll(".root-label")
        .attr("opacity", (o) => (isConnected(d, o) ? 1 : hover_textOpacity))

      graphNodesData
        .selectAll(".node-label")
        .attr("opacity", (o) => (isConnected(d, o) ? 1 : hover_textOpacity))

      graphLinksData
        .selectAll(".link")
        .attr("opacity", (o) =>
          o.source === d || o.target === d ? 1 : hover_strokeOpacity
        )

      graphLinksData
        .selectAll(".edge-label")
        .attr("opacity", (o) =>
          o.source === d || o.target === d ? 0.5 : hover_textOpacity
        )
    }

    function unhighlightConnections(graphNodesData, graphLinksData) {
      graphNodesData
        .selectAll(".node")
        .attr("opacity", nodeOpacity)
        .style("pointer-events", "auto")

      graphNodesData.selectAll(".bbox-label").attr("opacity", 0.8)
      graphNodesData.selectAll(".root-label").attr("opacity", 1)
      graphNodesData.selectAll(".node-label").attr("opacity", nodeTextOpacity)

      graphLinksData.selectAll(".link").attr("opacity", (d) => d.opacity)
      graphLinksData.selectAll(".edge-label").attr("opacity", linkTextOpacity)
    }
  } //draw: update nodes and edges of graph

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Graph Network: Update node and link styles ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function updateAttributes(nodes, links) {
    const ROOT_IDs = nodes.filter((d) => d.category === "author").map((d) => d.id)

    // set up accessors
    const root = (d) => ROOT_IDs.indexOf(d.id) !== -1
    const colorAccessor = (d) => colorScale(d.category)

    const accessors = { root }

    function findType(d) {
      if (root(d)) {
        return "root"
      } else {
        return "children"
      }
    }

    // create custom link strength scale based on total number of connections to node (node could be either a source or target)
    var strengthScale = d3
      .scaleLinear()
      .domain(d3.extent(links, (d) => +d.total))
      .range([0.9, 0.1])

    nodes.forEach((d) => {
      d.strokeWidth = nodeStrokeWidth
      d.opacity = nodeOpacity
    })

    links.forEach((d) => {
      d.strokeColor = linkStroke
    })

    nodes.forEach((d) => {
      d.type = findType(d)
      d.radius = nodeRadiusScale(+d.total)
      d.color = colorAccessor(d)
      d.strokeColor = colorAccessor(d)
    })

    links.forEach((d) => {
      d.strength = strengthScale(+d.total)
      d.strokeWidth = linkWidthScale(+d.total)
      d.opacity = linkOpacityScale(+d.total)
    })

    return { nodes, links, accessors }
  } //updateAttributes: update attribute values assigned to nodes and edges

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////// Graph Network: Update graph layout ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  function updateGraph(data) {
    let { nodes, links, summary } = data

    // remove links that do not have either a start and end node in nodes variable
    let nodeIDs = nodes.map((d) => d.id)
    links = links.filter((d) => {
      return (
        (nodeIDs.indexOf(d.start_id) !== -1) & (nodeIDs.indexOf(d.end_id) !== -1)
      )
    })

    let newEle = updateAttributes(nodes, links)
    nodes = newEle.nodes
    links = newEle.links

    links.forEach((d) => {
      d.source = nodes.find((el) => el.id === d.start_id)
      d.target = nodes.find((el) => el.id === d.end_id)
    })

    links.forEach((d) => {
      linkedByIndex[`${d.source.id},${d.target.id}`] = 1
    })

    var forceCharge = d3.forceManyBody().strength(function (d) {
      return -100
      //return Math.min(-100, +d.total * -5)
    })
    var forceCollide = d3.forceCollide(function (d) {
      return Math.max(d.radius * 1.5, 28)
      //return d.radius * 1.9;
    })

    draw(nodes, links, newEle.accessors, summary)

    simulation
      .force("charge", forceCharge)
      .force("collide", forceCollide)
      .force("x", d3.forceX(width / 2).strength(0.25))
      .force("y", d3.forceY(height / 2).strength(0.5))

    simulation.nodes(nodes).on("tick", ticked)
    simulation.force("link").links(links)

    function ticked() {
      var k = 0
      while (simulation.alpha() > 1e-2 && k < 150) {
        simulation.tick()
        k = k + 1
      }

      d3.selectAll(".node-group").attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")"
      })

      d3.selectAll(".link").attr("d", (d) =>
        generatePath(
          {
            source: { x: d.source.x, y: d.source.y, r: d.source.radius },
            target: { x: d.target.x, y: d.target.y, r: d.target.radius },
          },
          true
        )
      )
    }

    return { nodes, links }
  } //updateGraph
} //networkLayout

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.02).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged(d) {
  d.fx = d3.event.x
  d.fy = d3.event.y
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0)
  //d.fx = null;
  //d.fy = null;
}

function releasenode(d) {
  d.fx = null
  d.fy = null
}

function generatePath(d, exclude_radius = false) {
  let sourceNewX, sourceNewY, targetNewX, targetNewY
  let dx = d.target.x - d.source.x
  let dy = d.target.y - d.source.y
  let gamma = Math.atan2(dy, dx) // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan

  if (exclude_radius) {
    sourceNewX = d.source.x + Math.cos(gamma) * d.source.r
    sourceNewY = d.source.y + Math.sin(gamma) * d.source.r
    targetNewX = d.target.x - Math.cos(gamma) * d.target.r
    targetNewY = d.target.y - Math.sin(gamma) * d.target.r
  } else {
    sourceNewX = d.source.x
    sourceNewY = d.source.y
    targetNewX = d.target.x - Math.cos(gamma) * d.target.r
    targetNewY = d.target.y - Math.sin(gamma) * d.target.r
  }

  // Coordinates of mid point on line to add new vertex.
  let midX = (targetNewX - sourceNewX) / 2 + sourceNewX
  let midY = (targetNewY - sourceNewY) / 2 + sourceNewY
  return (
    "M" +
    sourceNewX +
    "," +
    sourceNewY +
    "L" +
    midX +
    "," +
    midY +
    "L" +
    targetNewX +
    "," +
    targetNewY
  )
}

function showTooltip(data, links, summary) {
  d3.selectAll("#top_categories").selectAll("li").remove()
  d3.selectAll("#top_keywords").selectAll("li").remove()

  const summary_data = summary.find((d) => d.id === data.id)
  const top_list_data = links.filter((d) => d.start_id === data.id)
  const top_categories = top_list_data.filter(
    (d) => d.category === "author-categories"
  )
  const top_keywords = top_list_data.filter((d) => d.category === "author-keywords")

  d3.select("#title h2").html(data.id)

  d3.select(".avatar")
    .style('display', 'block')

  d3.select(".avatar img") 
    .attr('src', summary_data.avatar)

  d3.select("#summary").html(
    `${summary_data.article_count} articles written, with total of ${summary_data.comment_count} comments written by readers.`
  )

  d3.select("#top_categories")
    .select("ul")
    .selectAll("li")
    .data(top_categories.slice(0, 3))
    .enter()
    .append("li")
    .text((d) => d.end_id)

  d3.select("#top_keywords")
    .select("ul")
    .selectAll("li")
    .data(top_keywords.slice(0, 3))
    .enter()
    .append("li")
    .text((d) => d.end_id)

  calendar()(data.id)
}

function showInitCard(data) {
  const { nodes, links } = data
  const articles_count = nodes.filter((d) => d.category === "author")
  const categories_count = nodes.filter((d) => d.category === "categories")
  const keywords_count = nodes.filter((d) => d.category === "keywords")

  d3.select("#title h2").html(`${nodes.length} entities, ${links.length} connections`)

  d3.select(".avatar")
    .style('display', 'none')

  d3.select("#summary")
    .html(`${articles_count.length}<span class='red'> authors</span>, 
           ${categories_count.length}<span class='blue'> categories</span>, 
           ${keywords_count.length}<span class='darkblue'> keywords</span>`)

  d3.select("#top_categories")
    .select("ul")
    .selectAll("li")
    .data(categories_count.slice(0, 3))
    .enter()
    .append("li")
    .text((d) => d.id)

  d3.select("#top_keywords")
    .select("ul")
    .selectAll("li")
    .data(keywords_count.slice(0, 3))
    .enter()
    .append("li")
    .text((d) => d.id)

  calendar()("Overall")
}
