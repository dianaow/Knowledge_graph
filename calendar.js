function calendar() {

  d3.select("#calendar-chart svg").remove()
  d3.select(".calendar-tooltip").remove()

  const width = 350
  const weekday = 'monday'
  const cellSize = 15
  const height = cellSize * (weekday === "weekday" ? 7 : 9)
  const timeWeek = weekday === "sunday" ? d3.utcSunday : d3.utcMonday
  const countDay = weekday === "sunday" ? d => d.getUTCDay() : d => (d.getUTCDay() + 6) % 7

  const formatValue = d3.format("+.2%")
  const formatClose = d3.format("$,.2f")
  const formatDate = d3.timeFormat("%Y-%m-%d")
  const formatDay = d => "SMTWTFS"[d.getUTCDay()]
  const formatMonth = d3.utcFormat("%b")
  const parseDate = d3.timeParse("%Y-%m-%d")

  const calendar = d3.select("#calendar-chart")

  const tooltip = calendar
    .append("div")
    .style("opacity", 0)
    .attr("class", "calendar-tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("padding", "5px")

  const mouseover = function(d) {
    tooltip.style("opacity", 1)
  }
  const mousemove = function(d) {
    tooltip
      .html("Date: " + formatDate(d.day_month) + " Articles: " + d.value)
      .style("left", (d3.mouse(this)[0]) + "px")
      .style("top", (d3.mouse(this)[1]) + "px")
  }
  const mouseleave = function(d) {
    tooltip.style("opacity", 0)
    calendar.selectAll('circle')
      .attr('fill', 'black')
      .attr('opacity', 0.3)
      .attr('r', 3.5)
  }

  const renderCalendar = (name) => {   
    d3.csv("/data/timeline.csv").then(function(data) {

        data.forEach((d,i)=>{
          d.day_month = parseDate(d.day_month)
          d.value = +d.total
        }) 

        const max = d3.quantile(data.map(d => Math.abs(d.value)).sort(d3.ascending), 0.9975);
        const color = d3.scaleLinear().range(['#F5F5F5', '#E10100']).domain([0, +max]);

        data = data.filter(d=>d.author === name)

        // create an empty day-month cell for each device every day of the year
        const currentMonth = new Date().getUTCMonth() + 1
        const startMonth = currentMonth - 4
        const current = new Date(2020, currentMonth, 1)
        const start = new Date(2020, startMonth, 1)
        const days = d3.timeDays(start, current)

        const authors = d3.groups(data, d=>d.author)
        authors.forEach(d=>{
          let empty = []
          days.forEach(x=>{
            let t = data.find(el=>el.day_month.getTime() === x.getTime() & el.author === d[0])
            if(t){
              empty.push({day_month: new Date(x.setDate(x.getDate())), value: t.value, author: d[0] })
            } else {
              empty.push({day_month: new Date(x.setDate(x.getDate())), value: 0, author: d[0] })     
            }
          })
          d[1] = empty
        })

        const svg = calendar
            .append('svg')
            .attr('width', width)
            .attr('height', height * authors.length)
            //.attr("viewBox", [0, 0, width, height * years.length])

        const year = svg.selectAll("g")
          .data(authors)
          .join("g")
            .attr("transform", (d, i) => `translate(20,${height * i + cellSize * 1.5})`)

        year.append("g")
            .attr("text-anchor", "end")
          .selectAll("text")
          .data((weekday === "weekday" ? d3.range(2, 7) : d3.range(7)).map(i => new Date(1995, 0, i)))
          .join("text")
            .attr("x", -5)
            .attr("y", d => (countDay(d) + 0.5) * cellSize)
            .attr("dy", "0.31em")
            .style('font-size', '9px')
            .text(formatDay)

        const month = year.append("g")
          .selectAll("g")
          .data(([, values]) => {
            return d3.utcMonths(start, current)
          })
          .join("g");

        month.filter((d, i) => i).append("path")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("d", pathMonth);

        month.append("text")
            .attr("x", d => timeWeek.count(start, timeWeek.ceil(d)) * cellSize + 2)
            .attr("y", -5)
            .style('font-size', '9px')
            .text(formatMonth);

        year.append("g")
          .selectAll("rect")
          .data(weekday === "weekday" 
              ? ([, values]) => values.filter(d => ![0, 6].includes(d.day_month.getUTCDay()))
              : ([, values]) => values)
          .join("rect")
            .attr("width", cellSize - 1)
            .attr("height", cellSize - 1)
            .attr("x", function(d) { 
              return timeWeek.count(start, d.day_month) * cellSize + 0.5 
            })
            .attr("y", d => countDay(d.day_month) * cellSize + 0.5)
            .attr("fill", d => color(d.value))
            .attr('pointer-events', 'all')
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        function pathMonth(t) {
          const n = weekday === "weekday" ? 5 : 7;
          const d = Math.max(0, Math.min(n, countDay(t)));
          const w = timeWeek.count(d3.utcYear(t), t);
          return `${d === 0 ? `M${w * cellSize},0`
              : d === n ? `M${(w + 1) * cellSize},0`
              : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${n * cellSize}`;
        }

        Date.prototype.addDays = function (days) {
          var date = new Date(this.valueOf())
          date.setDate(date.getDate() + days)
          return date
        }
    });
  }

  return renderCalendar

}