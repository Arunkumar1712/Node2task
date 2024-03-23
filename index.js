import express from "express";
import { MongoClient } from "mongodb";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
// middleware
app.use(express.json());

const port = process.env.PORT; // Corrected
console.log(process.env.PORT); // Corrected
console.log(process.env.MONGO_URL);
const mongoURI = process.env.MONGO_URL;
// Asigning DBName
let DBName = "Roombookingtask";

const client = new MongoClient(mongoURI,{ useNewUrlParser: true, useUnifiedTopology: true });
let roomsdetails; // collection in db for rooms
let Bookingrecords; //collection in db for Booking

// Function to conect MongoDB
async function createConnection() {
  try{
  await client.connect();
  const db = client.db(DBName);
  roomsdetails = db.collection("rooms");
  Bookingrecords = db.collection("Booking");
  console.log("mongodb is connected");
  }catch (error){
    console.error('Failed to connect to MongoDB:', error);
  }
}
createConnection(); //calling the function

console.log(mongoURI); // Log MongoDB connection string here

//Function for displaying home
app.get("/", function (req, res) {
  res.send(`
    <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            text-align: center;
            color: #333;
          }
          h4 {
            margin-bottom: 10px;
            color: #666;
          }
          p {
            color: #444;
          }
        </style>
      
      <body>
        <div class="container">
          <h1>Welcome to the Hall Booking Application</h1>
          <p>This application allows you to create Room ,Booking Room ,Rooms which are booked ,Customer who booked room and how many times an custmer booked the room on the server.</p>
          <h4>To create a create Room Use "/rooms",  add after the render link</h4>
          <h4>To get a available  Room Use "/availablerooms", add after the render link</h4>
          <h4>To Book a Room Use "/booking",add after the render link </h4>
          <h4>To list all booked rooms Use "/bookings",add after the render link</h4>
          <h4>To get count of customers booked rooms Use "/customer-bookings",add after the render link</h4>
        </div>
      </body>
      
    `);
});

// End point for creating the room
app.post("/rooms", async function (req, res) {
  try {
    // Creating a Room with Number of Seats available, amenities in room, Price for 1 Hour
    const room = await roomsdetails.insertOne(req.body);

    // Constructing the HTML response
    const htmlResponse = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f0f0f0;
            }
.container {
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
h1 {
              text-align: center;
              color: #333;
            }
h4 {
              margin-bottom: 10px;
              color: #666;
            }
p {
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Room created successfully</h1>
           </div>
        </body>
      </html>
    `;

    // Sending the HTML response
    res.send(htmlResponse);
  } catch (error) {
    console.error(error, "Something went wrong 😞, please try again later");
    res.status(500).send("Something went wrong 😞, please try again later");
  }
});

// End point to get available rooms
app.get("/availablerooms", async function (req, res) {
  try {
    // Retrieve all room details from the collection
    const allRooms = await roomsdetails.find({}).toArray();
    // Concatenate the CSS styles with the HTML string
    const htmlResponse = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div class="container" style="max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          ${allRooms
            .map(
              (room) => `
            <div class="room" style="margin-bottom: 20px;">
              <h2 style="text-align: center; color: #333;">${
                room.roomNumber
              }</h2>
              <p style="color: #444;">Number of Seats: ${
                room.seatsAvailable
              }</p>
              <p style="color: #444;">Amenities: ${room.amenities.join(
                ", "
              )}</p>
              <p style="color: #444;">Price per Hour: ${room.pricePerHour}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
    `;
    // Respond with the HTML containing inline styles
    res.send(htmlResponse);
  } catch (error) {
    console.error(error, "Something went wrong 😞, please try again later");
    res.status(500).send("Something went wrong 😞, please try again later");
  }
});

// End points for booking the room

app.post("/booking", async function (req, res) {
  try {
    const { customerName, roomNumber, date, starttime, endtime } = req.body;

    // Check if there's any existing booking for the given room and time slot
    const existingBooking = await Bookingrecords.findOne({
      roomNumber: roomNumber,
      date: date,
      $or: [
        { starttime: { $lte: starttime }, endtime: { $gte: starttime } },
        { starttime: { $lte: endtime }, endtime: { $gte: endtime } },
        { starttime: { $gte: starttime }, endtime: { $lte: endtime } },
      ],
    });

    if (existingBooking) {
      res.send(`<div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
                  <p style="color: red;">Room is already booked for this time slot. Please try a different time slot.</p>
                </div>`);
    } else {
      // If no existing booking, insert the new booking
      const booking = await Bookingrecords.insertOne(req.body);
      res.send(`<div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
                  <p style="color: green;">Room is successfully booked.</p>
                </div>`);
    }
  } catch (error) {
    console.error("Error booking room:", error);
    res.status(
      500
    ).send(`<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
    <div class="container" style="max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <p style="color: red;">Failed to book room. Please try again later.</p>
    </div>
</body>`);
  }
});

/// to list all booked rooms data
app.get("/bookings", async function (req, res) {
  try {
    // Retrieve all rooms from the collection
    const allRooms = await roomsdetails.find().toArray();
    const result = [];

    // Iterate over each room
    for (const room of allRooms) {
      // Find all bookings for the current room
      const bookingsForRoom = await Bookingrecords.find({
        roomNumber: room.roomNumber,
      }).toArray();

      // Iterate over each booking for the current room
      for (const booking of bookingsForRoom) {
        result.push({
          RoomNumber: room.roomNumber,
          CustomerName: booking.customerName,
          Date: booking.date,
          CheckinTime: booking.startTime,
          CheckoutTime: booking.endTime,
        });
      }
    }

    // Construct the HTML response
    const htmlResponse = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div class="container" style="max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <h2 style="text-align: center; color: #333;">List of Booked Rooms</h2>
          ${result
            .map(
              (booking) => `
            <div class="booking" style="margin-bottom: 20px;">
              <h3 style="text-align: center; color: #666;">Room Number: ${booking.RoomNumber}</h3>
              <p style="color: #444;">Customer Name: ${booking.CustomerName}</p>
              <p style="color: #444;">Date: ${booking.Date}</p>
              <p style="color: #444;">Check-in Time: ${booking.CheckinTime}</p>
              <p style="color: #444;">Checkout Time: ${booking.CheckoutTime}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
    `;

    // Respond with the HTML containing inline styles and booking information
    res.send(htmlResponse);
  } catch (error) {
    console.error(error, "Something went wrong 😞, please try again later");
    res.status(500).send("Something went wrong 😞, please try again later");
  }
});

////To get count of customers booked rooms
app.get("/customer-bookings", async function (req, res) {
  try {
    // Retrieve all bookings from the collection
    const allBookings = await Bookingrecords.find().toArray();
    const customerBookingCounts = {};

    // Iterate over each booking
    for (const booking of allBookings) {
      const {
        customerName,
        roomNumber,
        date,
        startTime,
        endTime,
        bookingDate,
        _id,
      } = booking;

      // Construct a unique key for each customer-room combination
      const bookingKey = `${customerName}_${roomNumber}`;

      // Initialize the booking count for the customer-room combination if it doesn't exist
      if (!customerBookingCounts[bookingKey]) {
        customerBookingCounts[bookingKey] = {
          CustomerName: customerName,
          RoomName: roomNumber,
          BookingCount: 0,
          Bookings: [],
        };
      }

      // Increment the booking count for the customer-room combination
      customerBookingCounts[bookingKey].BookingCount++;

      // Add the booking details to the list of bookings for the customer-room combination
      customerBookingCounts[bookingKey].Bookings.push({
        BookingId: _id,
        Date: date,
        StartTime: startTime,
        EndTime: endTime,
        BookingDate: bookingDate,
        BookingStatus: "Booked", // Assuming all bookings are marked as "Booked"
      });
    }

    // Convert the object of customer booking counts to an array
    const customerBookingsList = Object.values(customerBookingCounts);

    // Check if there are no bookings
    if (customerBookingsList.length === 0) {
      const htmlResponse = `
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
          <div class="container" style="max-width: 800px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #333;">No Bookings Found</h2>
          </div>
        </body>
      `;
      res.send(htmlResponse);
      return; // Exit the function early
    }

    // Construct the HTML response
    const htmlResponse = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f0f0;">
        <div class="container" style="max-width: 800px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <h2 style="text-align: center; color: #333;">Customer Booking Summary</h2>
          ${customerBookingsList
            .map(
              (customerBooking) => `
            <div class="customer-booking" style="margin-bottom: 20px;">
              <h3 style="color: #666;">Customer Name: ${
                customerBooking.CustomerName
              }</h3>
              <p style="color: #444;">Room Name: ${customerBooking.RoomName}</p>
              <p style="color: #444;">Total Bookings: ${
                customerBooking.BookingCount
              }</p>
              <h4 style="color: #888;">Bookings:</h4>
              ${customerBooking.Bookings.map(
                (booking) => `
                <div class="booking" style="margin-left: 20px;">
                  <p style="color: #444;">Booking ID: ${booking.BookingId}</p>
                  <p style="color: #444;">Date: ${booking.Date}</p>
                  <p style="color: #444;">Start Time: ${booking.StartTime}</p>
                  <p style="color: #444;">End Time: ${booking.EndTime}</p>
                  <p style="color: #444;">Booking Date: ${booking.Date}</p>
                  <p style="color: #444;">Booking Status: ${booking.BookingStatus}</p>
                </div>
              `
              ).join("")}
            </div>
          `
            )
            .join("")}
        </div>
      </body>
    `;

    // Respond with the HTML containing customer booking summary
    res.send(htmlResponse);
  } catch (error) {
    console.error(error, "Something went wrong 😞, please try again later");
    res.status(500).send("Something went wrong 😞, please try again later");
  }
});
app.listen(port, () => console.log("Server Started"));
