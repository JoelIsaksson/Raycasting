class Ray
{
	constructor(x, y, angle)
	{
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.direction = new Vec2(Math.cos(angle), Math.sin(angle));
		this.hit = null;
		this.hitObject = null;
		this.hitPoint = null;
		this.length = Infinity;
	}

	cast(objects, points)
	{
		for (let a = objects.length - 1; a >= 0; a--) 
		{
			for (let b = objects[a].edges.length - 1; b >= 0; b--) 
			{
				let edge = objects[a].edges[b];
				let p, d;
				if((p = this.intersects(edge)) && ((d = p.distance({x: this.x, y: this.y})) < this.length))
				{
					this.hitPoint = p;
					this.hitObject = objects[a];
					this.hit = edge;
					this.length = d;
				} 
			}
		}
	}

	intersects (edge)
	{
		let x1 = edge.p1.x, x2 = edge.p2.x, y1 = edge.p1.y, y2 = edge.p2.y;
		let x3 = this.x, x4 = this.x+this.direction.x, y3 = this.y, y4 = this.y + this.direction.y;

		let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

		if(Math.abs(den) < 0.0000000001) return 0;

		let t = ((x1-x3) * (y3-y4) - (y1 - y3) * (x3 - x4))/den;
		let u = -((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3))/den;

		if(t >= -0 && t <= 1 && u > 0)
		{
			return new Vec2(x1 + t*(x2 - x1), (y1 + t*(y2-y1)));
		}

		return 0;

	}
}

class Light
{
	constructor(x, y, direction = -Math.PI/2, circleSection = 2*Math.PI, radius = 300)
	{
		this.radius = radius;
		this.x = x;
		this.y = y;
		this.direction = direction;
		this.circleSection = circleSection;
		this.hits = [];
	}

	castRays(objects)
	{

		this.hits = [];
		
		for (let a = objects.length - 1; a >= 0; a--) 
		{
			for (let b = objects[a].edges.length - 1; b >= 0; b--) 
			{
				let edge = objects[a].edges[b];
				for(let i = -1; i < 2; i++)
				{
					let direction1 = Math.atan2((this.y - edge.p1.y), (this.x-edge.p1.x));
					let r1 = new Ray(this.x, this.y, direction1 + i* 0.0001);
					r1.cast(objects);

					let colorIndex = r1.hitObject.edges.indexOf(r1.hit)%3;
					this.hits.push([r1.hitPoint, direction1, r1.hitObject.color[colorIndex], r1.hit]);

					let direction2 = Math.atan2((this.y - edge.p2.y), (this.x-edge.p2.x));
					let r2 = new Ray(this.x, this.y, direction2 + i* 0.0001);
					r2.cast(objects);

					colorIndex = r2.hitObject.edges.indexOf(r2.hit)%3;
					this.hits.push([r2.hitPoint, direction2, r2.hitObject.color[colorIndex], r2.hit]);
				}
			}
		}

		this.trimHits();
	}

	trimHits()
	{
		// Remove hits along the same edge.

		//Sort the triangles by angle;
		this.hits.sort((a, b) => {return a[1] - b[1]});		

		let edgehit = this.hits[0][3];

		// If the point is inbetween two points on the same edge we can remove it
		for(let i = 1; i < this.hits.length; i++)
		{
			if(this.hits[i][3] == edgehit)
			{
				if(this.hits[i][3] == this.hits[(i+1)%this.hits.length][3])
				{
					this.hits.splice(i--, 1);
				}
			}
			else
			{
				edgehit = this.hits[i][3];
			}
		}
	}

	createTriangles(baseColor = [255, 250, 232, 255])
	{
		// create triangles

		let triangles = [];

		let thisPoint = new Vec2(this.x, this.y);

		for(let i = 0; i < this.hits.length; i += 1)
		{
			let color = [baseColor, this.hits[i][2], this.hits[(i+1)%this.hits.length][2]];
			triangles.push(new Triangle([thisPoint, this.hits[i][0], this.hits[(i+1)%this.hits.length][0]], color));
		}

		return triangles;
	}

	move(x, y, objects)
	{
		this.x = x;
		this.y = y;
		this.castRays(objects);
	}
}