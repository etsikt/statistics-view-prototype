jQuery(function($) {
    function parse_query_string(query) {
        var vars = query.split("&");
        var query_string = {};
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1]);
            // If first entry with this name
            if (typeof query_string[key] === "undefined") {
                query_string[key] = decodeURIComponent(value);
            // If second entry with this name
            } else if (typeof query_string[key] === "string") {
                var arr = [query_string[key], decodeURIComponent(value)];
                query_string[key] = arr;
                // If third or later entry with this name
            } else {
                query_string[key].push(decodeURIComponent(value));
            }
        }
        return query_string;
    }        
    function urlParamsToObject(){
        if (document.location.search === '') return {};

        const search = location.search.substring(1);
        return parse_query_string(search);
    }

    function createDiagram(data) {
        //set up svg using margin conventions - we'll need plenty of room on the left for labels
        var margin = {
            top: 15,
            right: 25,
            bottom: 15,
            left: 250
        };

        var width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#graphic").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .range([0, width])
            .domain([0, d3.max(data, function (d) {
                return d.enrollment_percentage_category;
            })]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([height, 0], .1)
            .domain(data.map(function (d) {
                return d.name;
            }));

        //make y axis to show bar names
        var yAxis = d3.svg.axis()
            .scale(y)
            //no tick marks
            .tickSize(0)
            .orient("left");

        var gy = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        var bars = svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("g")

        //append rects
        bars.append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.name);
            })
            .attr("height", y.rangeBand())
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.enrollment_percentage_category);
            });

        //add a value label to the right of each bar
        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.name) + y.rangeBand() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.enrollment_percentage_category) + 3;
            })
            .text(function (d) {
                return d.enrollment_percentage_category;
            });
    }

    const urlParamsObj = urlParamsToObject();
    var municipalityId =  urlParamsObj && urlParamsObj['municipalityId'];
    var courseId =  urlParamsObj && urlParamsObj['courseId'];
    if (municipalityId !== undefined && courseId !== undefined) {
        d3.json("https://statistics-api.azurewebsites.net/api/statistics/primary_schools/municipality/" + municipalityId + "/course/" + courseId, function(error, result) {
            var data = result.Result[0].schools;
            if (error) {
                throw error;
            }

            //sort bars based on value
            data = data.sort(function (a, b) {
                return d3.ascending(a.enrollment_percentage_category, b.enrollment_percentage_category);
            })

            createDiagram(data);
        });        
    }
});


