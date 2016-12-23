$( document ).ready(function() {
	'use strict';
	//Load config	
	var oii={};
	oii.config = function(url, callback) {
		var xhr = sigma.utils.xhr();

		if (!xhr)
			throw 'XMLHttpRequest not supported, cannot load the file.';

		xhr.open('GET', "config.json", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				//do something
				var config=JSON.parse(xhr.responseText);
				if (callback) callback(config);
			}
		};
		xhr.send();
	};	
	
	// Add a method to the graph model that returns an
	// object with every neighbors of a node inside:
	sigma.classes.graph.addMethod('neighbors', function(nodeId, filterByActive=false) {
		var k, kOut, kIn,
			neighbors = {},
			index = this.allNeighborsIndex[nodeId] || {};
	
        var indexOut = this.outNeighborsIndex[nodeId];
        //var indexIn = this.inNeighborsIndex[nodeId];
                                  
        for (k in index) {
        	if( filterByActive && this.nodesIndex[k].hidden == true ) {
        		continue;
        	}
		    neighbors[k] = this.nodesIndex[k];
            var connectionType = "Incoming";
            
            for (kOut in indexOut) {
                if(kOut == neighbors[k].id) {
                    connectionType = "Outgoing";
                    break;
                }
            }
                                  
            neighbors[k]["connectionType"] = connectionType;
            /*
             // TODO - check also incoming to enable mutual
             for (kIn in indexIn) {
                if(indexIn[kIn].id == neighbors[k].id) {
                    neighbors[k].in = true;
                    break;
                }
            } */
        }

		return neighbors;
	});
                    
    

	function graph_setup(s) {
		console.log("Setting up the graph");
        
        var groupByDirection=false;
        if (oii.config.informationPanel.groupByEdgeDirection && oii.config.informationPanel.groupByEdgeDirection==true)	groupByDirection=true;
                    
		// We first need to save the original colors of our
		// nodes and edges, like this:
		s.clusters={};
		s.graph.nodes().forEach(function(n) {
			n.originalColor = n.color;
			if (! (n.color in s.clusters)) {
				s.clusters[n.color]=[];
			}
			s.clusters[n.color].push(n.id);
		});
	
		s.graph.edges().forEach(function(e) {
			e.originalColor = e.color;
		});

		var resetItems = function (action, filterByActive=false) {
			s.graph.nodes().forEach(function(n) {
				if( filterByActive && n.hidden == true ) {
        			return;
        		}
				itemAction(n,"activate",action);
			});
			s.graph.edges().forEach(function(e) {
				if( filterByActive && e.hidden == true ) {
        			return;
        		}
		  		itemAction(e,"activate",action);
			});
			s.refresh();
		};
        

		// When a node is clicked or hover, we check for each node
		// if it is a neighbor of the clicked one. If not,
		// we set its color as grey, and else, it takes its
		// original color.
		// We do the same for the edges, and we only keep
		// edges that have both extremities colored.
		var itemAction = function (obj,state,action) {

			var behaviour = "";
			if( action == "hover") {
				if(oii.config.features.hoverBehavior && oii.config.features.hoverBehavior==="dim") {
					behaviour = "dim";
				}
			} else {
				if (oii.config.features.clickBehavior && oii.config.features.clickBehavior==="dim") {
					behaviour = "dim";
				}
			}

			switch (state) {
				case 'deactivate': 
					if(behaviour==="dim") {
						obj.color = oii.config.features.dimColor;
					} else {
						obj.hidden = true;
					}
					break;
				case 'activate':
						obj.color = obj.originalColor;
						obj.hidden = false;
					break;
				default: 
					break;
			}
		};
			
		
		
		var highlightNode=function(nodeId, showInfoPane=true) {
			var toKeep = s.graph.neighbors(nodeId);
			toKeep[nodeId] = true; //SAH -- example code had entire node object here
			
			var neighbors=new Array(toKeep.length);
            var neighborsIn=new Array();
            var neighborsOut=new Array();
			var nodeObj=false;
			highlightNodeState = true;
			highlightedNode = nodeId;

			s.graph.nodes().forEach(function(n) {
				if (toKeep[n.id]) {
					itemAction(n, "activate", "click");
					if (nodeObj===false && nodeId==n.id) {
						//TODO: Force label of this node to be printed (this is focal node)
						//Not possible? -- see force_labels.js
						nodeObj=n;
					} else {
						//TODO: separate out direction of links if specificed in config (incoming, outgoing, mutual)
                        if(groupByDirection) {
                            if(n.connectionType == "Incoming") {
                                neighborsIn.push('<li class="node" data-id="'+n.id+'"><a href="javascript:void(0);">'+n.label+'</a></li>');
                            }
                            else {
                                neighborsOut.push('<li class="node" data-id="'+n.id+'"><a href="javascript:void(0);">'+n.label+'</a></li>');
                            }
                        } else {
                            neighbors.push('<li class="node" data-id="'+n.id+'"><a href="javascript:void(0);">'+n.label+'</a></li>');
                        }
						
					}
				} else {
					itemAction(n, "deactivate", "click");
				}
			});

			s.graph.edges().forEach(function(e) {
				if (toKeep[e.source] && toKeep[e.target]) {
					itemAction(e, "activate", "click");
				} else {
					itemAction(e, "deactivate", "click");
				}
			});

			// Always call refresh after modifying data
			s.refresh();

			if(showInfoPane) {
			
				var attr=new Array();
				//attr.push("<dt>Label</dt><dd class=\"node\" data-id=\""+nodeObj.id+"\">"+nodeObj["label"]+"</dd>")
				if (nodeObj["attributes"]) {
					for (var key in nodeObj["attributes"]) {
						attr.push("<dt>"+key+"</dt><dd>"+nodeObj["attributes"][key]+"</dd>")
					}
				}
				
				//Populate attributepane
				var pane = $("#attributepane");
				pane.find(".headertext").html("Node details");
	            
                pane.find(".bodytext").html("<h2 class=\"node cf\" data-id=\""+nodeObj.id+"\">"+nodeObj["label"]+"klfdsjf sdkjflksd sdlkfj sdlkfj</h2><dl>"+attr.join("")+"</dl>"+'<h3>Neighbors:</h3><div>&nbsp;</div>');
                
                if(groupByDirection) {
                    if(neighborsIn.length > 0) {
                        pane.find(".bodytext").html(pane.find(".bodytext").html() + "<h4>Incoming neighbors (" + neighborsIn.length + ") </h4><ul>"+neighborsIn.join("")+"</ul>");
                    }
                    else {
                        pane.find(".bodytext").html(pane.find(".bodytext").html() + "<h4>Incoming neighbors</h4><div>No incoming links</div>");
                    }
                    pane.find(".bodytext").html(pane.find(".bodytext").html() + "<div>&nbsp;</div>");
                    if(neighborsOut.length > 0) {
                        pane.find(".bodytext").html(pane.find(".bodytext").html() + "<h4>Outgoing neighbors (" + neighborsOut.length + ") </h4><ul>"+neighborsOut.join("")+"</ul>");
                    }
                    else {
                        pane.find(".bodytext").html(pane.find(".bodytext").html() + "<h4>Outgoing neighbors</h4><div>No outgoing links</div>");
                    }
            	}
            	else {
                	pane.find(".bodytext").html("<h2 class=\"node\" data-id=\""+nodeObj.id+"\">"+nodeObj["label"]+"</h2><dl>"+attr.join("")+"</dl><h2>Neighbors:</h2><ul>"+neighbors.join("")+"</ul>");
            	}
				
				pane.delay(400).animate({width:'show'},350);
		
				$(".node").click(function() {
					var nodeId=$(this).attr("data-id");
					var renderer = s.renderers[0];
					renderer.dispatchEvent('outNode', {node:s.graph.nodes(nodeId)});
					highlightNode(nodeId);
				});
				
				$(".node").hover(function() {
						//Mouse in
						var nodeId=$(this).attr("data-id");
						var renderer = s.renderers[0];
						renderer.dispatchEvent('overNode', {node:s.graph.nodes(nodeId)});
					}, function() {
						//Mouse out
						var nodeId=$(this).attr("data-id");
						var renderer = s.renderers[0];
						renderer.dispatchEvent('outNode', {node:s.graph.nodes(nodeId)});
					}
				);
			}
		};

		var hoverNode=function(nodeId, showInfoPane=false) {
			var toKeep = s.graph.neighbors(nodeId,highlightNodeState);
			toKeep[nodeId] = true; //SAH -- example code had entire node object here
			
			var neighbors=new Array(toKeep.length);
            var neighborsIn=new Array();
            var neighborsOut=new Array();
			var nodeObj=false;

			s.graph.nodes().forEach(function(n) {
				if (toKeep[n.id]) {
					itemAction(n, "activate", "hover");
					if (nodeObj===false && nodeId==n.id) {
						//TODO: Force label of this node to be printed (this is focal node)
						//Not possible? -- see force_labels.js
						nodeObj=n;
					} 
				} else {
					itemAction(n, "deactivate", "hover");
				}
			});

			s.graph.edges().forEach(function(e) {
				if (toKeep[e.source] && toKeep[e.target]) {
					itemAction(e, "activate", "hover");
				} else {
					itemAction(e, "deactivate", "hover");
				}
			});

			// Always call refresh after modifying data
			s.refresh();
			

		};

		s.bind('overNode', function(e) {
			//if(!highlightNodeState) {
				hoverNode(e.data.node.id, false);		
			//}
		});

		s.bind('outNode', function(e) {
			if(highlightNodeState) {
				highlightNode(highlightedNode, false);
			} else {
				resetItems("hover",highlightNodeState);
			}
		}); 
		
		s.bind('clickNode', function(e) {
			highlightNode(e.data.node.id);
		});


		$("#attributepane .left-close").click(function(evt) {
			$("#attributepane").delay(400).animate({width:'hide'},350);
			resetItems('click');
			s.refresh();
			highlightNodeState = false;
		});

		$("#zoom").find("div.z").each(function () {
        	var a = $(this),
            b = a.attr("rel");
        	
        	a.click(function (e) {
				if (b == "center") {
					sigma.misc.animation.camera(
  						s.camera,
  						{ ratio: 1, x: 0, y: 0, angle: 0 },
  						{ duration: 150 }
					);
				} else {
		        	var pos = s.camera.cameraPosition(
            			sigma.utils.getX(e) - sigma.utils.getCenter(e).x,
            			sigma.utils.getY(e) - sigma.utils.getCenter(e).y,
            			true
          			);

					var ratio = oii.config.sigma.settings.doubleClickZoomingRatio;
          			sigma.utils.zoomTo(s.camera, pos.x, pos.y, ("in" == b ? 1 / ratio  : ratio), { duration: 150 });		
				}

        	});
    	});

	
		//Populate the group selection box
		var cluster_html=Array(s.clusters.length);
		var x = 0;
		for (var cluster in s.clusters) {
			cluster_html[x]='<div style="line-height:12px"><a href="#' + cluster + '" class="groupSelect" data-cluster="' + cluster +'"><div style="width:40px;height:12px;border:1px solid #fff;background:' + cluster + ';display:inline-block"></div> Group ' + (x++) + ' (' + s.clusters[cluster].length + ' members)</a></div>';
		}
		$("#attributeselect .list").html(cluster_html.join(""));
		
		var select = $("#attributeselect .select");
		select.click(function () {
			var selector=$(this);
			var list = selector.next(".list");
			if (this.display) {
				this.display = !1;
				list.hide();
				selector.removeClass("close");
			} else {
				this.display = !0;
				list.show();
				selector.addClass("close");
			}
		});
			
		$(".groupSelect").click(function(evt){
			var cluster = $(this).attr("data-cluster");		
			var toKeep={};
			var results=[];
			s.graph.nodes().forEach(function(n) {
				if (n.originalColor==cluster) {
					itemAction(n, "activate", "click");
					toKeep[n.id]=true;
					results.push('<li class="node" data-id="'+n.id+'"><a href="javascript:void(0);">'+n.label+'</a></li>');

				} else {
					itemAction(n, "deactivate", "click");
				}
			});

			s.graph.edges().forEach(function(e) {
				if (toKeep[e.source] && toKeep[e.target])
					itemAction(e, "activate", "click");
				else
					itemAction(e, "deactivate", "click");
			});
			s.refresh();
		
			var pane = $("#attributepane");
			pane.find(".headertext").html("Cluster members");
			pane.find(".bodytext").html("<ul>"+results.join("")+"</ul>");
			pane.delay(400).animate({width:'show'},350);
		
			$(".node").click(function() {
				var nodeId=$(this).attr("data-id");
				var renderer = s.renderers[0];
				renderer.dispatchEvent('outNode', {node:s.graph.nodes(nodeId)});
				highlightNode(nodeId);
			});
			
			$(".node").hover(function() {
					//Mouse in
					var nodeId=$(this).attr("data-id");
					var renderer = s.renderers[0];
					renderer.dispatchEvent('overNode', {node:s.graph.nodes(nodeId)});
				}, function() {
					//Mouse out
					var nodeId=$(this).attr("data-id");
					var renderer = s.renderers[0];
					renderer.dispatchEvent('outNode', {node:s.graph.nodes(nodeId)});
				}
			);

		});
	
		//Code for search:
		$("#searchbox").keydown(function(evt) {
			if (evt["keyCode"]==13 || evt["key"]=="Enter") {
				var str=$(this).val();
				if (str.length>=3) {
					//Do a search!
					console.log("Searching for " + str);
					var results=new Array();
					s.graph.nodes().forEach(function(n) {
						var regex = new RegExp(str,"gi"); //global, case-insensitive
						if (regex.test(n.label)) {
							//results[n.id]=n.label;
							results.push('<li class="node" data-id="'+n.id+'"><a href="javascript:void(0);">'+n.label+'</a></li>');
						}
					});
					if (results.length==0) {
						results.push("<li>No results</li>");
					}
					var pane = $("#attributepane");
					pane.find(".headertext").html("Search results");
					pane.find(".bodytext").html("<ul>"+results.join("")+"</ul>");
					pane.delay(400).animate({width:'show'},350);
				
					$(".node").click(function() {
						var nodeId=$(this).attr("data-id");
						highlightNode(nodeId);
					});
				}
				return false;
			}
		});
	

	}

	var s, highlightNodeState = false, highlightedNode = 0;
	oii.config('config.json', function(config) {
		if (config["version"]!=="2.0") {
			console.log("Bad config file version. Cannot proceede");
			document.getElementById('graph-container').innerHTML="<h1>The configuration file is of the wrong version, malformed, or inaccessible. The graph cannot be loaded.</h1>";
			return;
		}
		console.log("Config OK");
		sigma.parsers.json(config["data"],function(graph) {
			s = new sigma({
				graph: graph,
				renderer: {
					container: document.getElementById('graph-container'),
					type: 'canvas'
				},
				settings: config["sigma"]["settings"]
			});
			graph_setup(s);
		});
		oii.config=config;
	
		//function setupGUI(config) {
		// Initialise main interface elements
		var logo=""; // Logo elements
		if (config.logo.file) {

			logo = "<img src=\"" + config.logo.file +"\"";
			if (config.logo.text) logo+=" alt=\"" + config.logo.text + "\"";
			logo+=">";
		} else if (config.logo.text) {
			logo="<h1>"+config.logo.text+"</h1>";
		}
		if (config.logo.link) logo="<a href=\"" + config.logo.link + "\">"+logo+"</a>";
		$("#maintitle").html(logo);

		// #title
		$("#title").html("<h2>"+config.text.title+"</h2>");

		// #titletext
		$("#titletext").html(config.text.intro);

		// More information
		if (config.text.more) {
			$("#information").html(config.text.more);
		} else {
			//hide more information link
			$("#moreinformation").hide();
		}

		// Legend

		// Node
		if (config.legend.nodeLabel) {
			$(".node").next().html(config.legend.nodeLabel);
		} else {
			//hide more information link
			$(".node").hide();
		}
		// Edge
		if (config.legend.edgeLabel) {
			$(".edge").next().html(config.legend.edgeLabel);
		} else {
			//hide more information link
			$(".edge").hide();
		}
		// Colours
		if (config.legend.nodeLabel) {
			$(".colours").next().html(config.legend.colorLabel);
		} else {
			//hide more information link
			$(".colours").hide();
		}
	
		if (!config.features.search) {
			$("#search").hide();
		}
		if (!config.features.groupSelectorAttribute) {
			$("#attributeselect").hide();
		}
	   
		// Set hover and click dim color
		if (!config.features.dimColor) {
			config.features.dimColor = "#aaa";
		}
	});
	
	
});
