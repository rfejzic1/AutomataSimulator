"use strict"

class Node {
    constructor(ctx, x, y, radius, name) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.name = name;
        this.links = [];
    }

    setCenter(x, y) {
        this.x = x;
        this.y = y;
    }

    render() {
        this.links.forEach(node => {
            this.ctx.strokeStyle = "#333";
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
            let angle = Math.atan2(node.y - this.y, node.x - this.x);
            let px = node.x - this.radius * Math.cos(angle);
            let py = node.y - this.radius * Math.sin(angle);
            this.ctx.lineTo(px, py);
            this.ctx.stroke();
        });

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        this.ctx.strokeStyle = "#333";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.fillStyle = "#fff";
        this.ctx.fill();
        this.font = "16px Arial";
        this.ctx.fillStyle = "#333";
        this.ctx.fillText(this.name, this.x-2, this.y+4);
    }

    overlaps(node) {
        return Math.hypot(this.x - node.x, this.y - node.y) <= 2 * this.radius;
    }

    overlapsAny(nodes) {
        for(let i = 0; i < nodes.length; i++) {
            if(this != nodes[i] && this.overlaps(nodes[i])) {
                return true;
            }
        }
        return false;
    }
}

class Nodes {
    constructor() {
        this.nodes = [];
    }

    addNode(node) {   
        if(!node.overlapsAny(this.nodes))
            this.nodes.push(node);
        else
            console.log("There is alredy a Node on that position!")
        return this.nodes.length;
    }

    selectNode(x, y) {
        for(let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            if(node.overlaps({x, y}))
                return node;
        }
        return null;
    }

    linkNodes(node1, node2) {
        if(node1.links.indexOf(node2) == -1) {
            node1.links.push(node2);
        }
    }

    unlinkNodes(node1, node2) {
        let idx = node1.links.indexOf(node2);
        if(idx != -1) {
            node1.links.splice(idx, 1);
        }
    }

    bringToTop(node) {
        let idx = this.nodes.indexOf(node);
        if(idx <= -1)
            return;
        this.nodes.splice(idx, 1);
        this.nodes.push(node);
    }

    removeNode(node) {
        this.nodes.forEach(n => {
            this.unlinkNodes(n, node);
        });

        let idx = this.nodes.indexOf(node);
        if(idx <= -1)
            return;
        this.nodes.splice(idx, 1);
    }
}

class Simulator {
    constructor(canvas, options = null) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.max = 0;

        this.nodesList = new Nodes();
        this.selected = null;
        this.dragging = false;
        this.orgPos = {x: -1, y: -1};

        this.options = {
            nodeRadius: 16,
            selectionBoxOffset: 6
        }

        if(options) {
            this.options = {...this.options, ...options};
        }

        canvas.addEventListener("selectstart", e => e.preventDefault());

        canvas.addEventListener("mousedown", e => {
            if(e.button == 2)
                return;
            
            if(e.ctrlKey) {
                let node = new Node(this.ctx, e.offsetX, e.offsetY, this.options.nodeRadius, this.max);
                this.max = this.nodesList.addNode(node);
                this.selected = this.nodesList.selectNode(e.offsetX, e.offsetY);
            }else if(e.shiftKey) {
                if(this.selected) {
                    let prev = this.selected;
                    this.selected = this.nodesList.selectNode(e.offsetX, e.offsetY);
                    if(this.selected)
                        this.nodesList.linkNodes(prev, this.selected);
                }
            }else {
                this.selected = this.nodesList.selectNode(e.offsetX, e.offsetY);
            }

            if(e.button == 1) {
                this.removeStateHandler();
            }else {
                this.dragging = true;
            }
            
            if(this.selected) {
                let x = this.selected.x;
                let y = this.selected.y;
                this.orgPos = {x, y};
                this.nodesList.bringToTop(this.selected);
            }
        });

        canvas.addEventListener("mousemove", e => {    
            if(this.dragging) {
                if(this.selected) {
                    this.selected.setCenter(e.offsetX, e.offsetY);                    
                }else {
                    this.nodesList.nodes.forEach(node => {
                        node.setCenter(node.x + e.movementX, node.y + e.movementY);
                    });
                }
            }
        });

        canvas.addEventListener("mouseup", e => {
            if(e.button != 0)
                return;
            this.dragging = false;
            if(this.selected && this.selected.overlapsAny(this.nodesList.nodes)) {
                this.selected.setCenter(this.orgPos.x, this.orgPos.y);
            }
        });

        setInterval(() => this.render(), 30);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let sim = this;
        this.nodesList.nodes.forEach(node => {
            node.render();
            if(sim.selected == node) {
                sim.drawSelectionBox(node.x, node.y);
            }
        });
    }

    drawSelectionBox(x, y) {
        this.ctx.strokeStyle = "#8ac3f2";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.options.nodeRadius + this.options.selectionBoxOffset, 0, Math.PI * 2, true);
        this.ctx.stroke();
    }

    removeStateHandler() {
        if(this.selected) {
            this.nodesList.removeNode(this.selected);
            this.selected = null;
        }
    }

    restart() {
        this.nodesList = new Nodes();
        this.selected = null;
        this.dragging = false;
        this.max = 0;
    }
}

let canvas = document.getElementById("surface");
canvas.height = 320;
canvas.width = canvas.parentElement.clientWidth - parseInt(getComputedStyle(canvas.parentElement).padding) * 2;

let sim = new Simulator(canvas);
let resetBtn = document.getElementById("reset");
resetBtn.onclick = e => {
    sim.restart();
};

document.addEventListener("keypress", e => {
    if(e.key == "Delete") {
        sim.removeStateHandler();
    }
});
