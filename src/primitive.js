class Vec2
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	distance(a)
	{
		return Math.hypot(this.x - a.x, this.y - a.y);
	}

	norm()
	{
		const length = this.length();
		this.x /= length;
		this.y /= length;
	}

	length()
	{
		return Math.hypot(this.x, this.y);
	}
}

class Edge
{
	constructor(p1, p2)
	{
		this.p1 = p1;
		this.p2 = p2;
	}

	isTopLeft (p3)
	{
		return /*(this.p1.y - this.p2.y < 0.0000001 && this.p1.x < this.p2.x && this.p1.y < p3.y) || (this.p2.y - this.p1.y) > 0;*/ true
	}
}

class Triangle
{
	constructor(points, color = [[0,100, 255, 255], [0,100, 255, 255], [0,100, 255, 255]])
	{
		this.points = points;
		this.center = new Vec2((this.points[0].x + this.points[1].x + this.points[2].x)/3, (this.points[0].y + this.points[1].y + this.points[2].y)/3);
		this.edges = [];
		this.raster = [];
		this.changed = true;
		this.color = color;
		this.makeEdges();
	}

	makeEdges()
	{
		this.edges = [];

		for(let i = 0; i < this.points.length; i++)
		{
			this.edges.push(new Edge(this.points[i], this.points[(i+1)%3]));
		}
	}

	rasterize(image, light) // NYI
	{

		const lRadius = light.radius*light.radius;
		

		//Sort by Y.

		let sortedI = [0, 1, 2];

		if(this.points[sortedI[0]].y > this.points[sortedI[1]].y) [sortedI[0], sortedI[1]] = [sortedI[1], sortedI[0]];
		if(this.points[sortedI[1]].y > this.points[sortedI[2]].y) [sortedI[1], sortedI[2]] = [sortedI[2], sortedI[1]];
		if(this.points[sortedI[0]].y > this.points[sortedI[1]].y) [sortedI[0], sortedI[1]] = [sortedI[1], sortedI[0]];

		// Sorted vertices
		const sortedVerts = [this.points[sortedI[0]], this.points[sortedI[1]], this.points[sortedI[2]]];

		//colors

		const colors = [this.color[sortedI[0]], this.color[sortedI[1]], this.color[sortedI[2]]];

		// Split the triangle into a top and bottom triangle;
		const yM = sortedVerts[1].y;
		const xT = sortedVerts[0].x;

		// Find the left and right x values on the mid point;
		let xML = sortedVerts[1].x;
		const f = Math.max((yM - sortedVerts[0].y) / (sortedVerts[2].y - sortedVerts[0].y), 0);
		let xMR = (1 - f) * xT + f * sortedVerts[2].x;
		let cMR = colors[1];
		let cML = [(1 - f) * colors[0][0] + f * colors[2][0], (1 - f) * colors[0][1] + f * colors[2][1], (1 - f) * colors[0][2] + f * colors[2][2]];

		// Set the smaller x value to be the left x value;
		if(xML > xMR)
		{
			[xML, xMR] = [xMR, xML];
			[cML, cMR] = [cMR, cML];
		} 



		// If the trianlge did not have a upper horizontal edge draw the upper triangle.
		if(sortedVerts[0].y < yM)
		{
			const dy = (yM - sortedVerts[0].y);

			for(let y = Math.max(~~sortedVerts[0].y, 0), yE = Math.min(~~(yM + 0.5), image.height); y < yE; y++)
			{
				const f1 = Math.max((yM - y) / dy, 0), f0 = 1 - f1;
				const xL = f0 * xML + f1 *xT, xR = f1 * xT + f0 *xMR;

				const cL = [f0 * cML[0] + f1 * colors[0][0], f0 * cML[1] + f1 * colors[0][1], f0 * cML[2] + f1 * colors[0][2]];
				const cR = [f1 * colors[0][0] + f0 * cMR[0], f1 * colors[0][1] + f0 * cMR[1], f1 * colors[0][2] + f0 * cMR[2]];

				const i  = y * 4 * image.width;
				let dx = (~~(xR+0.5) - ~~xL); 

				for(let x = Math.max(~~xL, 0), xE = Math.min(~~(xR + 0.5), image.height); x < xE; x++)
				{
					const xf = Math.max((x - xL)/dx, 0);

					const r = xf * cL[0] + (1 - xf) * cR[0];
					const g = xf * cL[1] + (1 - xf) * cR[1];
					const b = xf * cL[2] + (1 - xf) * cR[2];

					let color = [r, g, b, 255];

					image.data.set(color, i + x*4);


				} 
			}
		}
		if(yM < sortedVerts[2].y)
		{
			const xB = sortedVerts[2].x;
			const cB = colors[2];

			const dy = (sortedVerts[2].y - yM);

			for(let y = Math.max(~~yM, 0), yE = Math.min(~~(sortedVerts[2].y + .5), image.height); y < yE; y++)
			{
				const f1 = Math.max((y - yM) / dy, 0), f0 = 1 - f1;
				const xL = f0 * xML + f1 *xB, xR = f0 * xMR + f1 *xB;
				const i  = y * 4 * image.width;

				const cL = [f0 * cML[0] + f1 * cB[0], f0 * cML[1] + f1 * cB[1], f0 * cML[2] + f1 * cB[2]];
				const cR = [f1 * cB[0] + f0 * cMR[0], f1 * cB[1] + f0 * cMR[1], f1 * cB[2] + f0 * cMR[2]];

			
				let dx = (~~(xR+0.5) - ~~xL); 

				for(let x = Math.max(~~xL, 0), xE = Math.min(~~(xR + 0.5), image.height); x < xE; x++)
				{
					const xf = Math.max((x - xL)/dx, 0);
					
					const r = xf * cL[0] + (1 - xf) * cR[0];
					const g = xf * cL[1] + (1 - xf) * cR[1];
					const b = xf * cL[2] + (1 - xf) * cR[2];

					//let color = [255, 250, 232, 255];

					const color = [r, g, b, 255];

					image.data.set(color, i + x*4);
					
				} 
			}
		}


		/*
		else
		{
			for(let i = 0; i < this.raster.length; i++)
			{
				image.data.set(this.raster[i][2], this.raster[i][1]*image.width*4 + this.raster[i][0]*4);
			}
		}

		this.changed = false;*/

	}

	renderPixels(start, y, data, image, light)
	{
		let coord = (y)*image.width*4 + (start)*4;
		
		//this.raster.push([p.x, p.y, color]);

		image.data.set(data.flat(), coord); //TODO: Color value and cliping;
	}

	renderPixel(p, w ,image, light, color)
	{
		/*let w0 = w[0]/w[3];
		let w1 = w[1]/w[3];
		let w2 = w[2]/w[3];*/

		let setcolor = !color;

		if(setcolor)
		{
			let fragDist = Math.abs(light.x - p.x); //p.distance({x: light.x, y: light.y});
			let pixelIntensity =  Math.min(Math.max(1.0 - fragDist*fragDist/(light.radius*light.radius), 0) , 1);
			let r = (w1 + w2 > 1) ? (this.color[1][0])*w1 + (this.color[2][0])*w2 : this.color[0][0];
			let b = (w1 + w2 > 1) ? (this.color[1][1])*w1 + (this.color[2][1])*w2 : this.color[0][1];
			let g = (w1 + w2 > 1) ? (this.color[1][2])*w1 + (this.color[2][2])*w2 : this.color[0][2];

			/*let r = w0 * this.color[0][0] + w1*this.color[1][0] + w2 * this.color[2][0];
			let g = w0 * this.color[0][1] + w1*this.color[1][1] + w2 * this.color[2][1];
			let b = w0 * this.color[0][2] + w1*this.color[1][2] + w2 * this.color[2][2];*/

			/*let r = this.color[0][0];
			let g = this.color[0][1];
			let b = this.color[0][2];*/
			color = [r, g, b,  pixelIntensity*255];
		}
		
		this.raster.push([p.x, p.y, color]);
		if(color[3] > 0);
			image.data.set(color, (p.y)*image.width*4 + (p.x)*4); //TODO: Color value and cliping;
	}

	edgeFunction(a, b, c)
	{
		return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
	}
}


class Polygon{
	constructor(x, y, corners, size, rotation = Math.PI/2)
	{
		this.center = new Vec2(x, y);
		this.triangles  = [];
		this.getPoints(corners, size, rotation);
		this.makeEdges();
		this.boundingBox = new Primitive()
	}

	getPoints(corners, size, rotation)
	{
		let direction;
		const innerAngle = Math.PI/corners;
		while(corners >  0)
		{
			direction = new Vec2(Math.cos(rotation), Math.sin(rotation));
			this.triangles.push(new Triangle(this.center.x + direction.x*size/2, this.center.y + direction*size/2, size/2, rotation));
			rotation += innerAngle;
		}

	}

	makeEdges()
	{
		for(let i = 0; i < this.points.length-1; i++)
		{
			this.edges.push([this.points[i], this.points[i+1%3]]);
		}
	}
}