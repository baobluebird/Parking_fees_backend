const { poolPromise } = require("../config/connection");
const fs = require("fs");
const geolib = require("geolib");

function setPriceForTypeCar(typeCar) {
  if (typeCar === "Xe ô tô dưới 16 chỗ, xe tải dưới 2,5 tấn") {
    return 15000;
  } else if (
    typeCar === "Xe ô tô từ 16 chỗ đến 30 chỗ, xe tải từ 2,5 tấn đến 3,5 tấn"
  ) {
    return 20000;
  } else if (typeCar === "Xe ô tô trên 30 chỗ, xe tải trên 3,5 tấn") {
    return 30000;
  }
}

function calculateParkingFee(vehicleType, hours) {
  // Define pricing based on vehicle type
  var pricing = {
    "Xe ô tô dưới 16 chỗ, xe tải dưới 2,5 tấn": {
      hour1: 15000,
      hour2: 15000,
      hour3: 20000,
      hour4: 20000,
      hour5_and_above: 25000,
    },
    "Xe ô tô từ 16 chỗ đến 30 chỗ, xe tải từ 2,5 tấn đến 3,5 tấn": {
      hour1: 20000,
      hour2: 20000,
      hour3: 25000,
      hour4: 25000,
      hour5_and_above: 30000,
    },
    "Xe ô tô trên 30 chỗ, xe tải trên 3,5 tấn": {
      hour1: 30000,
      hour2: 30000,
      hour3: 35000,
      hour4: 35000,
      hour5_and_above: 40000,
    },
    // Add more vehicle types and pricing if needed
  };

  // Define default pricing if vehicle type not found
  var defaultPricing = {
    hour1: 0,
    hour2: 0,
    hour3: 0,
    hour4: 0,
    hour5_and_above: 0,
  };

  // Get pricing for the specified vehicle type
  var selectedPricing = pricing[vehicleType] || defaultPricing;

  // Calculate total fee based on hours parked
  var totalFee = 0;
  if (hours >= 1 && hours < 2) {
    totalFee = selectedPricing.hour1;
  } else if (hours >= 2 && hours < 3) {
    totalFee = selectedPricing.hour2;
  } else if (hours >= 3 && hours < 4) {
    totalFee = selectedPricing.hour3;
  } else if (hours >= 4 && hours < 5) {
    totalFee = selectedPricing.hour4;
  } else if (hours >= 5) {
    totalFee = selectedPricing.hour5_and_above;
  }

  return totalFee;
}

const createFee = async (fee) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("fee", fee);
      const pool = await poolPromise;
      const Users = await pool
        .request()
        .input("LicensePlate", fee.licensePlate)
        .query("SELECT UserId FROM Users WHERE LicensePlate = @LicensePlate");
      const Fees = await pool
        .request()
        .input("LicensePlate", fee.licensePlate)
        .query("SELECT FeeId FROM Fees WHERE LicensePlate = @LicensePlate");
      if (Fees.recordset[0] !== undefined) {

        console.log("result", Fees.recordset[0]);

        const Bills = await pool
        .request()
        .input("FeeId", Fees.recordset[0].FeeId)
        .query("SELECT Location, CreatedAt FROM Bills WHERE FeeId = @FeeId");

        var newLatitude;
        var newLongitude;
        var oldLatitude;
        var oldLongitude;
        // //check lat long
        const NewLatLong = fee.location;
        const oldLatLong = Bills.recordset[0].Location;
        const regex =
          /LatLng\(latitude:(-?\d+\.\d+),\s*longitude:(-?\d+\.\d+)\)/;
        const match1 = regex.exec(NewLatLong);
        const match2 = regex.exec(oldLatLong);
        if (match1) {
          newLatitude = parseFloat(match1[1]);
          newLongitude = parseFloat(match1[2]);
        } else {
          console.log("Không tìm thấy tọa độ.");
        }
        if (match2) {
          oldLatitude = parseFloat(match2[1]);
          oldLongitude = parseFloat(match2[2]);
        } else {
          console.log("Không tìm thấy tọa độ.");
        }

        console.log("Latitude:", newLatitude);
        console.log("Longitude:", newLongitude);
        console.log("-------------------:");
        console.log("Latitude:", oldLatitude);
        console.log("Longitude:", oldLongitude);
        const initialCoords = {
          latitude: oldLatitude,
          longitude: oldLongitude,
        };
        function isInRadius(newCoords) {
          const radius = 20; // Bán kính là 10 mét
          const distance = geolib.getDistance(initialCoords, newCoords);
          return distance <= radius;
        }
        const newCoords = { latitude: newLatitude, longitude: newLongitude };

        // Kiểm tra và in kết quả
        console.log(
          "Tọa độ mới có nằm trong bán kính 10 mét từ tọa độ ban đầu không?"
        );
        console.log(isInRadius(newCoords));
        if (isInRadius(newCoords)) {
          console.log("Loại xe", fee.typeCar);
          console.log("new time parking", fee.sqlDateTime);
          console.log("old time parking", Fees.recordset[0].CreatedAt);
          //calculate hour
          var date1 = new Date(fee.sqlDateTime);
          var date2 = new Date(Fees.recordset[0].CreatedAt);
          var diff = Math.abs(date1 - date2);
          var hours = Math.floor(diff / 36e5);
          console.log("hours", hours);
          console.log("Fee", calculateParkingFee(fee.typeCar, hours));
        } else {
        }
      } else {
        const setPrice = setPriceForTypeCar(fee.typeCar);
        const imageData = fs.readFileSync(fee.imageData.path);

        const request = pool.request();

        request.input("UserId", Users.recordset[0].UserId);
        request.input("LicensePlate", fee.licensePlate);
        request.input("TypeCar", fee.typeCar);

        const result2 = await request.query(
          `INSERT INTO Fees(UserId, LicensePlate, TypeCar)
            VALUES(@UserId, @LicensePlate, @TypeCar)`
        );

        const getFeeQuery = `
        SELECT FeeId
        FROM Fees
        WHERE LicensePlate = @LicensePlate
        `;
        const getFeeRequest = pool.request();
        getFeeRequest.input("LicensePlate", fee.licensePlate);
        const feeResult = await getFeeRequest.query(getFeeQuery);
        
        request.input("FeeId", feeResult.recordset[0].FeeId);
        request.input("Location", fee.location);
        request.input("AddressParking", fee.address);
        request.input("IsPayment", fee.payment);
        request.input("ImageName", fee.imageFileName);
        request.input("ImageData", imageData);
        request.input("Price", setPrice);

        const result3 = await request.query(
          `INSERT INTO Bills(FeeId, Location, AddressParking, IsPayment, ImageName, ImageData, Price)
            VALUES(@FeeId, @Location, @AddressParking, @IsPayment, @ImageName, @ImageData, @Price)`
        );

        //resolve(result.recordset[0]); // Trả về kết quả cho hàm gọi
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createFee,
};
