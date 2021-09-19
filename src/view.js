class View
{

	constructor(image, ctx)
	{
		this.image = image;
		this.ctx = ctx;
		this.shadowMap = new Array(image.width * image.height).fill(0);
	}

	draw()
	{
		this.ctx.putImageData(this.image, 0, 0);
	}

	updateShadowMap(lights, obstructors)
	{
		this.shadowMap.fill(0);
		let lightTriangles = [];

		for(let i = 0; i < lights.length; i++)
		{
			lights[i].castRays(obstructors);

			for(let triangle of lights[i].createTriangles())
			{
				this.fillShadwowTriangle(triangle, lights[i])
			}
		}

		//this.blurShadows();
	}

	blurShadows()
	{

		let blurred = new Array(this.shadowMap.length);

		for(let y = 0, yE = this.image.height; y < yE; y++)
		{
			const yBlurStart = Math.max(y - 3, 0);
			const yBlurEnd   = Math.min(y + 4, yE);

			for(let x = 0, xE = this.image.width; x < xE; x++)
			{
				const xBlurStart = Math.max(x - 3, 0);
				const xBlurEnd   =  Math.min(x + 4, xE);

				let sum = 0;
				for(let yb = yBlurStart; yb  < yBlurEnd; yb++)
				{
					for(let xb = xBlurStart; xb < xBlurEnd; xb++)
					{
						sum += this.shadowMap[yb*xE + xb] * 1/(36);
					}
				}
				blurred[y*xE + x] = Math.min(sum, 255);
			}
		}


		this.shadowMap = blurred;
	}

	applyShadowMap()
	{
		for(let i = 0; i < this.shadowMap.length; i++)
		{
			this.image.data.set([this.shadowMap[i]], i*4 + 3)
		}
	}

	fillShadwowTriangle(triangle, light)
	{
		const lRadius = light.radius*light.radius;
		

		//Sort by Y.

		let sortedI = [0, 1, 2];

		if(triangle.points[sortedI[0]].y > triangle.points[sortedI[1]].y) [sortedI[0], sortedI[1]] = [sortedI[1], sortedI[0]];
		if(triangle.points[sortedI[1]].y > triangle.points[sortedI[2]].y) [sortedI[1], sortedI[2]] = [sortedI[2], sortedI[1]];
		if(triangle.points[sortedI[0]].y > triangle.points[sortedI[1]].y) [sortedI[0], sortedI[1]] = [sortedI[1], sortedI[0]];

		// Sorted vertices
		const sortedVerts = [triangle.points[sortedI[0]], triangle.points[sortedI[1]], triangle.points[sortedI[2]]];

		// Split the triangle into a top and bottom triangle;
		const yM = sortedVerts[1].y;
		const xT = sortedVerts[0].x;

		// Find the left and right x values on the mid point;
		let xML = sortedVerts[1].x;
		const f = Math.max((yM - sortedVerts[0].y) / (sortedVerts[2].y - sortedVerts[0].y), 0);
		let xMR = (1 - f) * xT + f * sortedVerts[2].x;

		// Set the smaller x value to be the left x value;
		if(xML > xMR)
		{
			[xML, xMR] = [xMR, xML];
		} 

		// If the trianlge did not have a upper horizontal edge draw the upper triangle.
		if(sortedVerts[0].y < yM)
		{
			const dy = (yM - sortedVerts[0].y);

			for(let y = Math.max(Math.round(sortedVerts[0].y-.5), 0), yE = Math.min(Math.round(yM), this.image.height); y < yE; y++)
			{
				const f1 = Math.max((yM - y) / dy, 0), f0 = 1 - f1;
				const xL = Math.round(f0 * xML + f1 *xT), xR = Math.round(f1 * xT + f0 *xMR);

				const i  = y * this.image.width;

				for(let x = Math.max(Math.round(xL), 0), xE = Math.min(Math.round(xR), this.image.height); x < xE; x++)
				{
					const p = new Vec2(x, y);
					const d = p.distance({x: light.x, y: light.y});
					const pixelIntensity =  Math.min(Math.max(1.0 - (d*d)/(lRadius), 0) , 1);
					
					this.shadowMap[i + x] = Math.min(this.shadowMap[i + x] + pixelIntensity*255, 255);
				} 
			}
		}
		if(yM < sortedVerts[2].y)
		{
			const xB = sortedVerts[2].x;
			const dy = (sortedVerts[2].y - yM);

			for(let y = Math.max(Math.round(yM), 0), yE = Math.min(Math.round(sortedVerts[2].y+.5), this.image.height); y < yE; y++)
			{
				const f1 = Math.max((y - yM) / dy, 0), f0 = 1 - f1;
				const xL = Math.round(f0 * xML + f1 *xB), xR = Math.round(f0 * xMR + f1 *xB);
				const i  = y * this.image.width;
			
				let dx = (~~(xR+0.5) - ~~xL); 

				for(let x = Math.max(Math.round(xL), 0), xE = Math.min(Math.round(xR), this.image.height); x < xE; x++)
				{
					const p = new Vec2(x, y);
					const d = p.distance({x: light.x, y: light.y});
					const pixelIntensity =  Math.min(Math.max(1.0 - (d*d)/(lRadius), 0) , 1);

					this.shadowMap[i + x] = Math.min(this.shadowMap[i + x] + pixelIntensity*255, 255);
				} 
			}
		}
	}
}