const { poolPromise } = require("../config/connection");

const createCode = async (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Kiểm tra email tồn tại
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("email", email)
        .query(`SELECT UserId FROM Users WHERE Email = @email`);
      if (result.recordset.length === 0) {
        reject({
          status: "ERR",
          message: "Email does not exist",
        });
      } else {
        //Kiểm tra email có tồn tại trong table Codes chưa
        const checkCode = await pool
          .request()
          .input("email", email)
          .query(`SELECT * FROM Codes WHERE Email = @email`);
        if (checkCode.recordset.length > 0) {
          //ghi đè code mới
          const nameCode = "Forgot Password";
          // Tạo code ngẫu nhiên
          const code = Math.floor(100000 + Math.random() * 900000);
          const updateResult = await pool.request();
          updateResult.input("email", email);
          updateResult.input("nameCode", nameCode);
          updateResult.input("code", code);
          await updateResult.query(
            `UPDATE Codes SET Code = @code WHERE Email = @email AND NameCode = @nameCode`
          );
          if (updateResult.rowsAffected[0] === 0) {
            reject({
              status: "ERR",
              message: "Failed to create code",
            });
          } else {
            //get id Code by email and name Code
            const result = await pool
              .request()
              .input("email", email)
              .input("nameCode", nameCode)
              .query(
                `SELECT CodeId FROM Codes WHERE Email = @email AND NameCode = @nameCode`
              );
            const codeId = result.recordset[0].CodeId;
            resolve({
              code: code,
              id: codeId,
              status: "OK",
              message: "Code created successfully",
            });
          }
        } else {
          // Lấy UserId từ Email
          const userId = result.recordset[0].UserId;
          const nameCode = "Forgot Password";
          // Tạo code ngẫu nhiên
          const code = Math.floor(100000 + Math.random() * 900000);

          // Chèn dữ liệu mới vào bảng Codes
          const insertResult = await pool.request();
          insertResult.input("userId", userId);
          insertResult.input("email", email);
          insertResult.input("nameCode", nameCode);
          insertResult.input("code", code);
          // Đã thêm dòng này để truyền giá trị email vào
          await insertResult.query(
            `INSERT INTO Codes (UserId, Email, NameCode, Code) VALUES (@userId, @email, @nameCode, @code)`
          );

          if (insertResult.rowsAffected[0] === 0) {
            reject({
              status: "ERR",
              message: "Failed to create code",
            });
          } else {
            //get id Code by email and name Code
            const result = await pool
              .request()
              .input("email", email)
              .input("nameCode", nameCode)
              .query(
                `SELECT CodeId FROM Codes WHERE Email = @email AND NameCode = @nameCode`
              );
            const codeId = result.recordset[0].CodeId;
            resolve({
              code: code,
              id: codeId,
              status: "OK",
              message: "Code created successfully",
            });
          }
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

const checkCode = async (id, code) => {
  return new Promise(async (resolve, reject) => {
    try {
        console.log(id, code)
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id", id)
        .input("code", code)
        .query(
          `SELECT * FROM Codes WHERE CodeId = @id AND Code = @code AND DATEDIFF(MINUTE, CreatedAt, GETDATE()) <= 30`
        );
      if (result.recordset.length === 0) {
        reject({
          status: "ERR",
          message: "Invalid code",
        });
      } else {
        resolve({
          status: "OK",
          message: "Code is valid",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  createCode,
  checkCode
};
