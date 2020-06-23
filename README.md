## Tech in Asia - Data Visualization Assignment


### Data Processing

I extracted data of 900 articles from Tech In Asia's API. After checking the available data attributes, i thought it will be useful to create a dashboard to better understand articles published on TIA by identifying trends in terms of author contribution and article topics. I conceptualized a graph network to be like a TIA 'universe' enabling the user to explore infuential authors or topics and their connections. To achieve this, I did some simple **Natural Language Processing** of article titles to extract keywords. This is done on the assumption that a TIA article's content can be summarized by just its title. Relationships between authors, title keywords and tagged categories were then established. **Graph analytics** was done to understand the global and local graph structure.

The jupyter notebook of the data analysis process can be found [here](https://github.com/dianaow/Tech_in_Asia_dataviz/blob/master/TIA.ipynb)

### Set up instructions

**1. Install 'http-server' to be able to serve content out of the local file system.** ([Node](https://nodejs.org/en/) is required to be installed first)

```npm install -g http-server```

**2. In the terminal, start the server:**

```http-server -a localhost -p 3000```

**3. Open http://localhost:3000 to view the webpage in the browser.**

#### Initial View
![alt text](https://github.com/dianaow/Tech_in_Asia_dataviz/blob/master/images/initial_view.png "Initial View")

### Dashboard Features

**1. Select a node to see its connections using hover effect**
* Only author nodes have detailed information such as summary statistics and timeline heatmap appearing in the right sidebar.

**2. Select a node using the search bar**
* Area of improvement: Search function currently only accepts exact keywords. Fuzzy search can be implemented in the future.
![alt text](https://github.com/dianaow/Tech_in_Asia_dataviz/blob/master/images/search_view.gif "Search View")

**3. Pan + Zoom + Drag graph**
![alt text](https://github.com/dianaow/Tech_in_Asia_dataviz/blob/master/images/zoom_view.gif "Zoom View")