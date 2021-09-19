canvas = document.getElementById("canvas");
ctx    = canvas.getContext("2d");

imageData = ctx.createImageData(768, 768);

for(let i = 0; i < imageData.width*imageData.height; i++){
	imageData.data.set([255, 250, 232, 0], i*4);
}


boundry = new Object();
boundry.edges = [
	new Edge({x: 0, y: 767}, {x: 0, y: 0}),
	new Edge({x: 0, y: 0}, {x: 767, y: 0}), 
	new Edge({x: 767, y: 0}, {x: 767, y: 767}), 
	new Edge({x: 767, y: 767}, {x: 0, y: 767})
];

boundry.color = [[0,100, 255, 255], [0,100, 255, 255], [0,100, 255, 255]];

triangle = new Triangle([{x:200, y:200}, {x:300, y:200}, {x:250, y:300}]);
triangle3 = new Triangle([{x:400, y:200}, {x:500, y:200}, {x:450, y:300}]);

triangle2 = new Triangle([{x:500, y:700}, {x:200, y:700}, {x:350, y:200}]);

/*triangle2.rasterize(imageData);
triangle3.rasterize(imageData);
triangle.rasterize(imageData);
*/
ctx.putImageData(imageData, 0, 0);

cell = [triangle, triangle2, triangle3];
cell.push(boundry);

l = new Light(768/2 + 40, 100);
l.castRays(cell);

view = new View(imageData, ctx);

ctx.putImageData(imageData, 0, 0)

let mouse = new Object();
mouse.held = false;

document.onmousedown = function (e)
{
	mouse.x = e.clientX-566;
	mouse.y = e.clientY;
	mouse.held = true;
}

document.onmouseup = function (e)
{
	mouse.held = false;
}

canvas.onmouseover = function (e) 
{
	if(mouse.held)
	{
		mouse.x = e.clientX-566;
		mouse.y = e.clientY;
	}
}

canvas.onmousemove = function (e) 
{
	if(mouse.held)
	{
		mouse.x = e.clientX-566;
		mouse.y = e.clientY;
	}
}

canvas.onmouseout = function (e) 
{
	if(mouse.held)
	{
		mouse.x = 0;
		mouse.y = 0;
	}
}

function update() {
	if(mouse.held)
	{
		l.move(mouse.x, mouse.y, cell);
	}
}


function loop(){
    startt = new Date().getTime();
    update();
    view.updateShadowMap([l], cell);
    view.applyShadowMap();
    view.draw();
        
    
    totalttime = startt - new Date().getTime();
    if(totalttime > 1/60)
        console.log("Took too long! Time: " + totalttime);
    requestAnimationFrame(loop);
}



requestAnimationFrame(loop);