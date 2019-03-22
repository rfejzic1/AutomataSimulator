"use strict"

class Node {
    constructor(ctx, x, y, radius, name) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.name = name;
    }

    setCenter(x, y) {
        this.x = x;
        this.y = y;
    }

    render() {
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
    }

    selectNode(x, y) {
        for(let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            if(node.overlaps({x, y}))
                return node;
        }
        return null;
    }

    bringToTop(node) {
        this.removeNode(node);
        this.nodes.push(node);
    }

    removeNode(node) {
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

        canvas.addEventListener("click", e => {
            if(e.button != 0)
                return;
            
            if(e.ctrlKey) {
                let node = new Node(this.ctx, e.offsetX, e.offsetY, this.options.nodeRadius, this.max);
                this.max += 1;
                this.nodesList.addNode(node);
            }
        });

        canvas.addEventListener("mousedown", e => {
            if(e.button != 0)
                return;
            
            this.selected = this.nodesList.selectNode(e.offsetX, e.offsetY);
            if(this.selected) {
                this.dragging = true;
                let x = this.selected.x;
                let y = this.selected.y;
                this.orgPos = {x, y};
                this.nodesList.bringToTop(this.selected);
            }
        });

        canvas.addEventListener("mousemove", e => {
            if(e.button != 0)
                return;
            
            if(this.selected && this.dragging) {
                this.selected.setCenter(e.offsetX, e.offsetY);                    
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
        if(this.selected)
            this.nodesList.removeNode(this.selected);
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
