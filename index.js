const { MongoClient, ServerApiVersion } = require('mongodb');
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
		origin: ['http://localhost:5173'],
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());

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

		const serviceCollection = client.db('rideMate').collection('services');

		// **** ALL SERVICES **** //

		app.get('/api/v1/services', async (req, res) => {
			try {
				let query = {};
				const result = await serviceCollection.find(query).toArray();
				res.send(result);
			} catch (error) {
				console.log(error);
			}
		});

		// **** BOOKING **** //

		app.post('/api/v1/user/create-booking', async (req, res) => {
			console.log(req.body);
		});

		// **** AUTHENTICATION || JWT **** //

		app.post('/api/v1/auth/access-token', async (req, res) => {
			try {
				const user = req.body;
				console.log(user);
				// Create token
				const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
					expiresIn: '10h',
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
