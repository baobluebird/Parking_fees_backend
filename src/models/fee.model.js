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
  };

  var defaultPricing = {
    hour1: 0,
    hour2: 0,
    hour3: 0,
    hour4: 0,
    hour5_and_above: 0,
  };

  var selectedPricing = pricing[vehicleType] || defaultPricing;

  var totalFee = 0;

  if (hours < 5) {
    totalFee =
      selectedPricing.hour1 + selectedPricing.hour2 + selectedPricing.hour3;
  } else {
    totalFee =
      selectedPricing.hour1 +
      selectedPricing.hour2 +
      selectedPricing.hour3 +
      selectedPricing.hour4 +
      selectedPricing.hour5_and_above;
  }

  return totalFee;
}

const createFee = async (fee) => {
  return new Promise(async (resolve, reject) => {
    try {
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
        console.log("FeeId", Fees.recordset[0].FeeId);
        const sql = `
    SELECT TOP 1 BillId, Location, Price, CreatedAt 
    FROM Bills 
    WHERE FeeId = @FeeId
    ORDER BY CreatedAt DESC;
    `;

        const result = await pool
          .request()
          .input("FeeId", Fees.recordset[0].FeeId)
          .query(sql);
        const Bills = result.recordset[0];

        var newLatitude;
        var newLongitude;
        var oldLatitude;
        var oldLongitude;

        const NewLatLong = fee.location; 
        const oldLatLong = Bills.Location;
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

        console.log("New Latitude:", newLatitude);
        console.log("New Longitude:", newLongitude);
        console.log("-------------------:");
        console.log("Old Latitude:", oldLatitude);
        console.log("Old Longitude:", oldLongitude);
        const initialCoords = {
          latitude: oldLatitude,
          longitude: oldLongitude,
        };
        function isInRadius(newCoords) {
          const radius = 20;
          const distance = geolib.getDistance(initialCoords, newCoords);
          return distance <= radius;
        }
        const newCoords = { latitude: newLatitude, longitude: newLongitude };

        console.log(
          "Tọa độ mới có nằm trong bán kính 10 mét từ tọa độ ban đầu không?"
        );
        console.log(isInRadius(newCoords));
        if (isInRadius(newCoords)) {
          console.log("Loại xe", fee.typeCar);
          console.log("new time parking", fee.sqlDateTime);
          console.log("old time parking", Bills.CreatedAt);
          //calculate hour
          var date1 = new Date(fee.sqlDateTime);
          var date2 = new Date(Bills.CreatedAt);
          var diff = Math.abs(date1 - date2);
          var hours = Math.floor(diff / 36e5);
          console.log("hours", hours);
          console.log("Fee", calculateParkingFee(fee.typeCar, hours));
          const setPrice = calculateParkingFee(fee.typeCar, hours);
          //update bill
          const request = pool.request();
          request.input("Location", fee.location);
          request.input("AddressParking", fee.address);
          request.input("IsPayment", fee.payment);
          request.input("ImageData", fee.image.data);
          request.input("ContentType", fee.image.ContentType);
          request.input("Price", setPrice);
          request.input("BillId", Bills.BillId);
          await request.query(
            `UPDATE Bills
            SET Location = @Location, AddressParking = @AddressParking, IsPayment = @IsPayment, ImageData = @ImageData, ContentType = @ContentType, Price = @Price
            WHERE BillId = @BillId`
          );

          const UpdateBill = await pool
            .request()
            .input("BillId", Bills.BillId)
            .query("SELECT BillId FROM Bills WHERE BillId = @BillId");

          if (UpdateBill.recordset[0] !== undefined) {
            resolve({
              status: "OK",
              data: UpdateBill.recordset[0],
              message: "Cập nhật Bill thành công",
            });
          } else {
            resolve({
              status: "Error",
              message: "Không có bản ghi Bill nào được cập nhật",
            });
          }
        } else {
          console.log("Tạo mới Bill");

          const setPrice = setPriceForTypeCar(fee.typeCar);

          const request = pool.request();

          request.input("Location", fee.location);
          request.input("AddressParking", fee.address);
          request.input("IsPayment", fee.payment);
          request.input("ImageData", fee.image.data);
          request.input("ContentType", fee.image.ContentType);
          request.input("Price", setPrice);
          request.input("FeeId", Fees.recordset[0].FeeId);
          const resultCreateBill = await request.query(
            `INSERT INTO Bills(FeeId, Location, AddressParking, IsPayment, ImageData, ContentType, Price)
            OUTPUT inserted.BillId
            VALUES(@FeeId, @Location, @AddressParking, @IsPayment, @ImageData, @ContentType, @Price)`
          );
          const newBillId = resultCreateBill.recordset[0].BillId;
          const resultSelectBill = await pool
          .request()
          .input("BillId", newBillId)
          .query("SELECT BillId, Location, AddressParking, IsPayment, ImageData, ContentType, Price, CreatedAt, UpdatedAt FROM Bills WHERE BillId = @BillId");

          if(resultSelectBill !== undefined){
            resolve({
              status: "OK",
              data: resultSelectBill.recordset[0],
              message: "Tạo mới Bill thành công",
            });
          }
          else{
            reject({
              status: "ERROR",
              message: "Tạo mới Bill thất bại",
            });
          }
        }
      } else {
        const setPrice = setPriceForTypeCar(fee.typeCar);

        const request = pool.request();

        request.input("UserId", Users.recordset[0].UserId);
        request.input("LicensePlate", fee.licensePlate);
        request.input("TypeCar", fee.typeCar);

        await request.query(
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
        console.log("Fee",fee );
        request.input("FeeId", feeResult.recordset[0].FeeId);
        request.input("Location", fee.location);
        request.input("AddressParking", fee.address);
        request.input("IsPayment", fee.payment);
        request.input("ImageData", fee.image.data);
        request.input("ContentType", fee.image.ContentType);
        request.input("Price", setPrice);

        const resultNewBillFromFee = await request.query(
          `INSERT INTO Bills(FeeId, Location, AddressParking, IsPayment, ImageData, ContentType, Price)
          OUTPUT inserted.BillId
            VALUES(@FeeId, @Location, @AddressParking, @IsPayment, @ImageData, @ContentType, @Price)`
        );
        const newBillId = resultNewBillFromFee.recordset[0].BillId;
        const resultSelectBill = await pool
        .request()
        .input("BillId", newBillId)
        .query("SELECT BillId, Location, AddressParking, IsPayment, ImageData, ContentType, Price, CreatedAt, UpdatedAt FROM Bills WHERE BillId = @BillId");
        if (resultSelectBill !== undefined) {
          resolve({
            status: "OK",
            data: resultSelectBill.recordset[0],
            message: "Tạo mới Bill từ Fee thành công",
          });
        } else {
          reject({
            status: "ERROR",
            message: "Tạo mới Bill từ Fee thất bại",
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createFee,
};
