const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// App variable
const app = express();

// Middleware
app.use(
	cors({
		origin: [
			'https://pawsgo-7d6e0.web.app',
			'https://pawsgo-7d6e0.firebaseapp.com',
		],
		credentials: true,
	})
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Verify JWT middleware
const verifyToken = async (req, res, next) => {
	// get the token
	const token = req?.cookies?.token;
	console.log('Token from middleware', token);
	if (!token) {
		return res.status(401).send({ message: 'unAuthorize Access' });
	}

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).send({ message: 'unAuthorize Access' });
		}
		req.user = decoded;
		next();
	});
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7o1h45b.mongodb.net/?retryWrites=true&w=majority`;

// Create client
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server
		await client.connect();

		// Service collection
		const serviceCollection = client.db('rideMate').collection('services');
		// Booking collection
		const bookingCollection = client.db('rideMate').collection('bookings');

		// **** SERVICES RELATED API **** //

		app.get('/api/v1/services', async (req, res) => {
			try {
				const serviceName = req.query.serviceName;
				const spEmail = req.query.serviceProviderEmail;
				let queryObj = {};
				if (serviceName) {
					queryObj.serviceName = serviceName;
				}
				if (spEmail) {
					queryObj.serviceProviderEmail = spEmail;
				}
				const result = await serviceCollection.find(queryObj).toArray();
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});

		// Get a specific service by id
		app.get('/api/v1/services/:id', async (req, res) => {
			try {
				const id = req.params.id;
				const query = { _id: new ObjectId(id) };
				const result = await serviceCollection.findOne(query);
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});
		// Delete a specific service by id
		app.delete('/api/v1/services/:id', async (req, res) => {
			try {
				const id = req.params.id;
				const query = { _id: new ObjectId(id) };
				const result = await serviceCollection.deleteOne(query);
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});
		// Update service api
		app.put('/api/v1/services/:id', async (req, res) => {
			const id = req.params.id;
			const updateService = req.body;
			const filter = { _id: new ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					serviceName: updateService.updateServiceName,
					serviceImage: updateService.updateServiceImage,
					price: updateService.updateServicePrice,
					serviceArea: updateService.updateServiceArea,
					serviceDescription: updateService.updateServiceDescription,
					serviceProviderEmail: updateService.updateServiceProviderEmail,
					serviceProviderName: updateService.updateServiceProviderName,
				},
			};
			const result = await serviceCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			res.send(result);
		});

		// Add service to the database
		app.post('/api/v1/add-service', async (req, res) => {
			try {
				const serviceData = req.body;
				const result = await serviceCollection.insertOne(serviceData);
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});

		// **** BOOKING **** //

		// Get specific user booking

		app.get('/api/v1/user/bookings', async (req, res) => {
			try {
				console.log('Token user', req.user);
				const userEmail = req.query.userEmail;
				const spEmail = req.query.serviceProviderEmail;
				let query = {};
				if (userEmail) {
					query.userEmail = userEmail;
				}
				if (spEmail) {
					query.serviceProviderEmail = spEmail;
				}
				const result = await bookingCollection.find(query).toArray();
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});

		app.patch('/api/v1/user/bookings/:id', async (req, res) => {
			try {
				console.log('Token user', req.user);
				const id = req.params.id;
				const updateStatus = req.body.status;
				// console.log(id, updateStatus);
				const options = { upsert: true };
				const filter = { _id: new ObjectId(id) };
				const updateDoc = {
					$set: {
						status: updateStatus,
					},
				};
				const result = await bookingCollection.updateOne(
					filter,
					updateDoc,
					options
				);
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});

		app.post('/api/v1/user/create-booking', async (req, res) => {
			try {
				const bookingData = req.body;
				const result = await bookingCollection.insertOne(bookingData);
				res.send(result);
				// console.log(result);
			} catch (error) {
				console.log(error);
			}
		});

		// **** AUTHENTICATION || JWT **** //

		app.post('/api/v1/auth/access-token', async (req, res) => {
			try {
				const user = req.body;
				// Create token
				const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
					expiresIn: '1h',
				});
				res
					.cookie('token', token, {
						httpOnly: true,
						secure: process.env.NODE_ENV === 'production',
						sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
					})
					.send({ message: 'success' });
			} catch (error) {
				console.log(error);
			}
		});

		// Logout and clear cookie
		app.post('/api/v1/auth/logout', async (req, res) => {
			try {
				const user = req.body;
				res.clearCookie('token', { maxAge: 0 }).send({ message: 'success' });
			} catch (error) {
				console.log(error);
			}
		});

		// Send a ping
		await client.db('admin').command({ ping: 1 });
		console.log(
			'Pinged your deployment. You successfully connected to MongoDB!'
		);
	} finally {
		// Note: You can close the client when the server stops
		// await client.close();
	}
}
run().catch(console.dir);

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(port, () => {
	console.log(`Ride Mate app listening on port ${port}`);
});
