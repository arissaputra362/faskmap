// Atrribut openstreetmap
var mbAttr =
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

// URL openstreetmap
// var mbUrl =
//     "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

var mbUrl = "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
var mbUrlSatelit = "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
var mbUrlHybrid = "http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";

// Grayscale map
var grayscale = L.tileLayer(mbUrlHybrid, {
    // id: "mapbox/light-v9",
    tileSize: 512,
    zoomOffset: -1,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    // attribution: mbAttr,
});

// Streets map
var streets = L.tileLayer(mbUrl, {
    // id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    // attribution: mbAttr,
});

// Streets map
var satelit = L.tileLayer(mbUrlSatelit, {
    // id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    // attribution: mbAttr,
});

// Layer Grup
var legends = L.layerGroup();

// Maps
var map = L.map("map", {
    center: curLocation,
    zoom: 14,
    layers: [streets, legends],
});

// Base Layer
var baseLayers = {
    Grayscale: grayscale,
    Streets: streets,
    Satelit: satelit,
};

// Overlay (simbol)
var overlays = {
    Legends: legends,
};

// Add layer to map
var layerControl = L.control.layers(baseLayers, overlays).addTo(map);

// Add pop up content
function onEachFeature(feature, layer) {
    var popupContent = "";

    if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent).on("popupopen", () => {
        $(".leaflet-popup").on("click", (e) => {
            focusOn(feature.id);
        });
    });
}

// Hospital icon Marker
var hospitalIcon = L.icon({
    iconUrl: "/icon/hospital.png",
    iconSize: [38, 38],
    popupAnchor: [0, -10],
});

// Pin Your Location icon Marker
var pinIcon = L.icon({
    iconUrl: "/icon/pin.png",
    iconSize: [38, 38],
    popupAnchor: [0, -10],
});

// Default hidden input value to get Current Position coordinates
$("#longitude").val(curLocation[1]);
$("#latitude").val(curLocation[0]);

// Your location Marker
var marker = new L.marker(curLocation, {
    draggable: "true",
    icon: pinIcon,
    zIndexOffset: 250,
    riseOnHover: true,
})
    .addTo(map)
    .bindPopup("Lokasi Anda")
    .openPopup();

// Your location Circle Area
var circle = new L.circle(curLocation, {
    color: "#0a8",
    fillColor: "#0f9",
    fillOpacity: 0.2,
    radius: 1000,
})
    .addTo(map)
    .bringToBack();

var smallCircle;
var routingLine;
let graphWeight = [];
var tempGraphLatLng = [];
// Save tempt routing destination
// var tempWay;
// Get Circle Center coordinates and radius
var circleCenter = circle.getLatLng();
var circleRadius = circle.getRadius();

// Check user GPS Position
map.on("locationfound", function (ev) {
    // Set marker and circle area coordinates to user gps coordinates
    marker.setLatLng(ev.latlng, {
        draggable: "true",
    });
    circle.setLatLng(ev.latlng);

    // Set circle center to circle coordinates
    circleCenter = circle.getLatLng();

    // Set new current location to marker location
    newCurr = marker.getLatLng();

    // Check faskes in current circle area
    insideCircle(hospitalLayer, circleCenter, circleRadius);

    // Set new hidden input value
    $("#longitude").val(newCurr.lng);
    $("#latitude").val(newCurr.lat).trigger("change");
});

// Locate map to current User GPS Coordinates
map.locate({ setView: true, maxZoom: 17 });

// Get All Faskes Data and set map legends(point)
var hospitalPoint = L.geoJSON([hospitals], {
    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature,

    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
            radius: 8,
            fillColor: "#0ea",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        });
    },
}).addTo(legends);

// Set Closest Faskes Icon with hospital icon
var hospitalLayer = L.geoJSON([hospitals], {
    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature,

    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
            icon: hospitalIcon,
        });
    },
});

// Road Way Data Sidoarjo
var roadwayLine = L.geoJSON([roadway], {
    style: function (feature) {
        return feature.properties && feature.properties.style;
    },

    onEachFeature: onEachFeature,

    function(feature, latlng) {
        return L.polyline(latlng, {
            color: "#fff",
            opacity: 0,
        });
    },
});

// Set new current coordinates with marker coordinates
newCurr = marker.getLatLng();

// Data List on click event to route from user location to faskes location
function focusOn(id) {
    hospitalLayer.eachLayer(function (layer) {
        if (id == layer.feature.id) {
            layer.addTo(legends).openPopup();
            smallCircle = undefined;
            smallCircleRadius = newCurr.distanceTo(layer.getLatLng());
            smallCircle = new L.circle(newCurr, {
                radius: smallCircleRadius,
                fillOpacity: 0,
                opacity: 0,
            })
                .addTo(map)
                .bringToBack();

            let iniJarakRute = insideSmallCircle(
                roadwayLine,
                smallCircle,
                newCurr,
                layer.getLatLng(),
                true
            );

            layer._popup.setContent(
                layer.feature.properties.popupContent +
                    "<br> Jarak : " +
                    (iniJarakRute / 1000).toFixed(3) +
                    " KM"
            );

            // let vertexPoint = ["A", "B", "C", "D", "E", "F", "H", "T"];
            // let vertexEdge = [
            //     ["H", "A", 2],
            //     ["H", "C", 4],
            //     ["H", "B", 5],
            //     ["A", "B", 2],
            //     ["C", "B", 1],
            //     ["C", "E", 4],
            //     ["A", "F", 12],
            //     ["A", "D", 7],
            //     ["B", "D", 4],
            //     ["B", "E", 3],
            //     ["D", "T", 5],
            //     ["E", "T", 7],
            //     ["F", "T", 3],
            // ];

            // let tesGraph = new WeightedGrap();

            // vertexPoint.forEach((element) => {
            //     tesGraph.addVertex(element);
            // });

            // vertexEdge.forEach((element) => {
            //     tesGraph.addEdge(element[0], element[1], element[2]);
            // });

            // let update = [
            //     ["B", "D", 1],
            //     // ["H", "A", 5],
            // ];

            // let hasilDijkstra = tesGraph.Dijkstra("H", "T", update);
            // console.log(hasilDijkstra);
        }
    });
}

function checkCoord(point) {
    if (typeof point == "string") {
        return JSON.parse(point);
    }
}

// Button set location click event
function findMe() {
    graphWeight = [];
    tempGraphLatLng = [];

    if (routingLine) {
        routingLine.remove();
        routingLine = undefined;
    }

    // Check user GPS Position
    map.on("locationfound", function (ev) {
        // Set marker and circle area coordinates to user gps coordinates
        marker.setLatLng(ev.latlng, {
            draggable: "true",
        });
        circle.setLatLng(ev.latlng);

        // Set circle center to circle coordinates
        circleCenter = circle.getLatLng();

        // Set new current location to marker location
        newCurr = marker.getLatLng();

        // Check faskes in current circle area
        insideCircle(hospitalLayer, circleCenter, circleRadius);

        // Set new hidden input value
        $("#longitude").val(newCurr.lng);
        $("#latitude").val(newCurr.lat).trigger("change");
    });

    // Locate map to current User GPS Coordinates
    map.locate({ setView: true, maxZoom: 17 });
}

function insideSmallCircle(road, smallCircle, start, finish, line) {
    var closestStart;
    var closestFinish;
    var distanceToStart = 0;
    var distanceToFinish = 0;
    tempGraphLatLng = [];
    graphWeight = [];

    tempGraphLatLng.push(start);

    road.eachLayer(function (layer) {
        if (smallCircle.getBounds().intersects(layer.getBounds())) {
            temp = layer.getLatLngs();

            for (let e = 0; e < temp.length; e++) {
                if (e != temp.length - 1) {
                    if (
                        distanceToStart == 0 ||
                        distanceToStart > start.distanceTo(temp[e])
                    ) {
                        distanceToStart = start.distanceTo(temp[e]);
                        closestStart = temp[e];
                    }

                    if (
                        distanceToFinish == 0 ||
                        distanceToFinish > finish.distanceTo(temp[e])
                    ) {
                        distanceToFinish = finish.distanceTo(temp[e]);
                        closestFinish = temp[e];
                    }

                    tempGraphLatLng.push(temp[e]);
                    graphWeight.push([
                        temp[e],
                        temp[e + 1],
                        temp[e].distanceTo(temp[e + 1]),
                    ]);
                } else {
                    if (
                        distanceToStart == 0 ||
                        distanceToStart > start.distanceTo(temp[e])
                    ) {
                        distanceToStart = start.distanceTo(temp[e]);
                        closestStart = temp[e];
                    }

                    if (
                        distanceToFinish == 0 ||
                        distanceToFinish > finish.distanceTo(temp[e])
                    ) {
                        distanceToFinish = finish.distanceTo(temp[e]);
                        closestFinish = temp[e];
                    }

                    tempGraphLatLng.push(temp[e]);
                    graphWeight.push([
                        temp[e],
                        temp[e],
                        temp[e].distanceTo(temp[e]),
                    ]);
                }
            }
        }
    });

    graphWeight.unshift([start, closestStart, distanceToStart]);
    graphWeight.push([finish, closestFinish, distanceToFinish]);

    tempGraphLatLng.push(finish);

    if (line == true) {
        return routingDijkstra(start, finish, line);
    } else {
        return routingDijkstra(start, finish, line);
    }
}

// Function to check if faskes inside circle area
function insideCircle(layer, center, radius) {
    var closest = 0;
    var newDistance;
    obj = [];
    console.log(center);

    layer.eachLayer(function (layer) {
        // Get layer coordinates
        layerLatLng = layer.getLatLng();

        // Distance layer from circle
        distance = layerLatLng.distanceTo(center);

        // Checking...
        if (distance <= radius) {
            smallCircle = undefined;
            smallCircleRadius = center.distanceTo(layerLatLng);
            smallCircle = new L.circle(center, {
                radius: smallCircleRadius,
                fillOpacity: 0,
                opacity: 0,
            })
                .addTo(map)
                .bringToBack();

            newDistance = insideSmallCircle(
                roadwayLine,
                smallCircle,
                center,
                layerLatLng,
                false
            );

            // console.log(newDistance);
            // Send Layer Data to data list
            obj.push({ id: layer.feature.id, jarak: newDistance });
            layer._popup.setContent(
                layer.feature.properties.popupContent +
                    "<br> Jarak : " +
                    (newDistance / 1000).toFixed(3) +
                    " KM"
            );
            // console.log(JSON.stringify({
            //     id: layer.feature.properties.popupContent,
            //     jarak: newDistance,
            // }));

            if (closest == 0 || closest > newDistance) {
                closest = newDistance;
                // open closest faskes with user position pop up
                layer.addTo(legends).openPopup();
            }
            // add hospital pin when faskes inside circle area
            layer.addTo(legends);
        } else {
            // remove popup and faskes pin when faskes outside circle area
            layer.closePopup().remove();
        }
    });
}

// Event when Marker drag
marker.on("dragend", function (event) {
    graphWeight = [];
    tempGraphLatLng = [];

    if (routingLine) {
        routingLine.remove();
        routingLine = undefined;
    }

    // coordinates to execute in this function while pin location dragging
    var position = marker.getLatLng();

    marker
        .setLatLng(position, {
            draggable: "true",
        })
        .openPopup()
        .update();

    newCurr = marker.getLatLng();
    circle.setLatLng(position);

    circleCenter = circle.getLatLng();
    circleRadius = circle.getRadius();

    // Check faskes inside circle area
    insideCircle(hospitalLayer, circleCenter, circleRadius);

    // Update current location value to get Data
    $("#longitude").val(position.lng);
    $("#latitude").val(position.lat).trigger("change");
});

function onMapClick(e) {
    graphWeight = [];
    tempGraphLatLng = [];

    if (routingLine) {
        routingLine.remove();
        routingLine = undefined;
    }
    // // remove routing
    // if (tempWay) {
    //     map.removeControl(route);
    // }

    // coordinates to execute in this function
    var position = e.latlng;

    marker
        .setLatLng(position, {
            draggable: "true",
        })
        .openPopup()
        .update();

    newCurr = marker.getLatLng();
    circle.setLatLng(position);

    circleCenter = circle.getLatLng();
    circleRadius = circle.getRadius();

    // Check faskes inside circle area
    insideCircle(hospitalLayer, circleCenter, circleRadius);

    // Update current location value to get Data
    $("#longitude").val(position.lng);
    $("#latitude").val(position.lat).trigger("change");
}

function routingDijkstra(start, finish, line) {
    var graph;
    if (routingLine) {
        routingLine.remove();
        routingLine = undefined;
    }

    graph = new WeightedGrap();

    tempGraphLatLng.forEach((element) => {
        graph.addVertex(element);
    });

    graphWeight.forEach((element) => {
        graph.addEdge(element[0], element[1], element[2]);
    });

    let hasilDijkstra = graph.Dijkstra(start, finish, graphWeight);

    let newHasil = [];

    hasilDijkstra.rute.forEach(function (ll) {
        if (typeof ll == "string") {
            // console.log(ll);
            var latlng = ll.split(/, ?/);
            let el = L.latLng(
                parseFloat(latlng[0].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)),
                parseFloat(latlng[1])
            );
            ll = el;
        }
        newHasil.push(ll);
    });

    // console.log(newHasil);

    if (line == true) {
        routingLine = new L.Polyline(newHasil, {
            color: "red",
            weight: 5,
            opacity: 0.5,
            smoothFactor: 1,
        });
        map.setZoom(16);
        routingLine.addTo(legends);
        console.log(hasilDijkstra.dist);
        return hasilDijkstra.dist;
    } else {
        return hasilDijkstra.dist;
    }
}

// Execute function when map on click
map.on("click", onMapClick);

$("#slide-up").click(function () {
    $(".app-bar").height("90%");
    $(".card-body").height("100%");
    $("#slide-up").hide();
    $("#slide-down").show();
    $(".back").removeClass("hide-beranda");
});

$("#slide-down").click(function () {
    $("#slide-up").show();
    $("#slide-down").hide();
    $(".app-bar").height(150);
    $(".card-body").height(140);
    $(".back").addClass("hide-beranda");
});

$(document).ready(function () {
    $("#slide-down").hide();
    $(".back").addClass("hide-beranda");

    // Execute check faskes inside circle area
    insideCircle(hospitalLayer, circleCenter, circleRadius);
});

function emptyObject(obj) {
    Object.keys(obj).forEach((k) => delete obj[k]);
}

class WeightedGrap {
    constructor() {
        this.adjacencyList = {};
    }

    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) {
            this.adjacencyList[vertex] = [];
        }
    }

    addEdge(vertex1, vertex2, weight, time = 0) {
        this.adjacencyList[vertex1].push({ node: vertex2, weight, time });
        this.adjacencyList[vertex2].push({ node: vertex1, weight, time });
    }

    Dijkstra(start, finish, updated) {
        const nodes = new PriorityQueue();
        const distances = {};
        const previous = {};
        let path = [];
        let smallest;
        let time = 0;

        for (let vertex in this.adjacencyList) {
            if (vertex == start) {
                nodes.enqueue(vertex, 0, time);
                distances[vertex] = 0;
            } else {
                distances[vertex] = Infinity;
                nodes.enqueue(vertex, Infinity, time);
            }

            previous[vertex] = null;
        }

        let countNode = 0;
        while (nodes.values.length) {
            smallest = nodes.dequeue().val;
            let updateCount = 0;
            time++;
            if (smallest === finish) {
                while (previous[smallest]) {
                    path.push(smallest);
                    smallest = previous[smallest];
                }
                break;
            }

            // console.log("Value Incre");
            // console.log(JSON.stringify(previous));
            // console.log(JSON.stringify(distances));

            if (smallest || distances[smallest] != Infinity) {
                for (let neighbor in this.adjacencyList[smallest]) {
                    // find neighbor node
                    let nextNode = this.adjacencyList[smallest][neighbor];
                    // console.log("Next Node");
                    // console.log(JSON.stringify(nextNode));

                    let candidate = distances[smallest] + nextNode.weight;
                    let nextNeighbor = nextNode.node;

                    if (candidate < distances[nextNeighbor]) {
                        distances[nextNeighbor] = candidate;

                        previous[nextNeighbor] = smallest;

                        nodes.enqueue(nextNeighbor, candidate, time);
                    }
                    // console.log("Value");
                    // console.log(JSON.stringify(nodes.values));
                }
            }

            if (countNode == nodes.values.length - 1) {
                // console.log("Check penambahan");
                while (updateCount < 10) {
                    let updatedData = [];
                    // Checking update
                    $.ajax({
                        headers: {
                            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr(
                                "content"
                            ),
                        },
                        url: "/updateRoad",
                        type: "POST",
                        dataType: "json",
                        async: false,
                        data: {
                            action: "exec_find",
                            data: JSON.stringify(updated),
                        },
                        success: function (data) {
                            // continue program
                            if (data) {
                                updatedData = JSON.stringify(data.data);
                            } else {
                                // console.log("Can't get data");
                            }
                        },
                        error: function (log) {
                            // handle error
                        },
                    });

                    updatedData = JSON.parse(updatedData);
                    let updatedCounting = 0;
                    if (updatedData.length > 0) {
                        // console.log(updatedData.length);
                        updatedData.forEach((updateElement) => {
                            // console.log("Update Element");
                            let eh = String(updateElement[1]);
                            let et = String(updateElement[0]);
                            let updatePriority = updateElement[2];
                            let i = 0;

                            nodes.values.forEach((node) => {
                                if (node.val == eh) {
                                    // console.log("Exec");
                                    if (
                                        previous[node.val] == et &&
                                        node.priority != Infinity
                                    ) {
                                        let nodeNeighbour =
                                            this.adjacencyList[node.val];
                                        let diff = 0;
                                        nodeNeighbour.forEach(
                                            (thisNeighbour) => {
                                                if (
                                                    thisNeighbour.node ==
                                                    previous[node.val]
                                                ) {
                                                    diff =
                                                        thisNeighbour.weight -
                                                        updatePriority;
                                                }
                                            }
                                        );
                                        // console.log(eh);
                                        // console.log(et);
                                        // console.log("Sebelum");
                                        // console.log(node.priority);
                                        // console.log(diff);
                                        node.priority = node.priority - diff;
                                        // console.log("Sesudah");
                                        // console.log(node.priority);
                                        if (i == 0) {
                                            distances[node.val] = node.priority;
                                            i++;
                                        } else {
                                            if (
                                                node.priority <
                                                distances[node.val]
                                            ) {
                                                distances[node.val] =
                                                    node.priority;
                                                // eh = et;
                                            }
                                            i++;
                                        }
                                    }
                                }
                            });

                            // console.log("Del MIN");
                            let startReturn = false;
                            nodes.del_min.forEach((node) => {
                                if (node.val == eh) {
                                    // console.log(previous[node.val]);
                                    if (previous[node.val] == et) {
                                        // console.log("DEL_MIN");
                                        // console.log(previous[node.val]);
                                        let nodeNeighbour =
                                            this.adjacencyList[node.val];
                                        let diff = 0;
                                        nodeNeighbour.forEach(
                                            (thisNeighbour) => {
                                                if (
                                                    thisNeighbour.node ==
                                                    previous[node.val]
                                                ) {
                                                    diff =
                                                        thisNeighbour.weight -
                                                        updatePriority;
                                                }
                                            }
                                        );
                                        node.priority = node.priority - diff;
                                        if (
                                            node.priority < distances[node.val]
                                        ) {
                                            distances[node.val] = node.priority;
                                        }
                                        // eh = et;
                                        startReturn = true;
                                    }
                                }
                                if (startReturn == true) {
                                    nodes.enqueue(
                                        node.val,
                                        node.priority,
                                        node.time
                                    );
                                    removeItemOnce(nodes.del_min, node);
                                }
                            });
                            // console.log("DEl MIN2");
                            updatedCounting++;
                        });
                        updatedData = [];
                        // console.log("Counting");
                        // console.log(updatedCounting);
                    }
                    updateCount++;
                }
            }
            // console.log(neg);
            countNode++;
        }
        // console.log("DEl MIN");
        // console.log(JSON.stringify(nodes.del_min));
        // console.log(whilee);
        // console.log("Distance");
        // console.log(distances[finish]);
        // console.log(path);

        let data = {
            rute: path.concat(smallest).reverse(),
            dist: distances[finish],
        };

        // return path.concat(smallest).reverse();
        return data;
    }
}

function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

class PriorityQueue {
    constructor() {
        this.values = [];
        this.del_min = [];
    }

    enqueue(val, priority, time) {
        let newNode = new Node(val, priority, time);
        this.values.push(newNode);
        this.bubbleUp();
    }

    bubbleUp() {
        let idx = this.values.length - 1;
        const element = this.values[idx];

        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            let parent = this.values[parentIdx];
            if (element.priority >= parent.priority) break;
            this.values[parentIdx] = element;
            this.values[idx] = parent;
            idx = parentIdx;
        }
    }

    bubbleUpDel() {
        let idx = this.del_min.length - 1;
        const element = this.del_min[idx];

        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            let parent = this.del_min[parentIdx];
            if (element.time >= parent.time) break;
            this.del_min[parentIdx] = element;
            this.del_min[idx] = parent;
            idx = parentIdx;
        }
    }

    dequeue() {
        const min = this.values[0];
        const end = this.values.pop();
        if (this.values.length > 0) {
            this.values[0] = end;
            this.sinkDown();
        }
        this.del_min.push(min);
        this.bubbleUpDel();
        return min;
    }

    sinkDown() {
        let idx = 0;
        const length = this.values.length;
        const element = this.values[0];

        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swap = null;
            if (leftChildIdx < length) {
                leftChild = this.values[leftChildIdx];
                if (leftChild.priority < element.priority) {
                    swap = leftChildIdx;
                }
            }

            if (rightChild < length) {
                rightChild = this.values[rightChildIdx];
                if (
                    (swap === null && rightChild.priority < element.priority) ||
                    (swap !== null && rightChild.priority < leftChild.priority)
                ) {
                    swap = rightChildIdx;
                }
            }

            if (swap === null) break;

            this.values[idx] = this.values[swap];
            this.values[swap] = element;
            idx = swap;
        }
    }

    sinkDownDel() {
        let idx = 0;
        const length = this.del_min.length;
        const element = this.del_min[0];

        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swap = null;
            if (leftChildIdx < length) {
                leftChild = this.del_min[leftChildIdx];
                if (leftChild.time < element.time) {
                    swap = leftChildIdx;
                }
            }

            if (rightChild < length) {
                rightChild = this.del_min[rightChildIdx];
                if (
                    (swap === null && rightChild.time < element.time) ||
                    (swap !== null && rightChild.time < leftChild.time)
                ) {
                    swap = rightChildIdx;
                }
            }

            if (swap === null) break;

            this.del_min[idx] = this.del_min[swap];
            this.del_min[swap] = element;
            idx = swap;
        }
    }
}

class Node {
    constructor(val, priority, time) {
        this.val = val;
        this.priority = priority;
        this.time = time;
    }
}
