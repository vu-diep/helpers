/**Tác giả: Vũ Hồng Điệp */

import { RequestServerHelpers } from "./core.js";
import { numberFormatHelpers } from "./coreFunctions.js";

/**Hàm có tác dụng xóa bỏ định sạng dấu , ở tiền tệ
 * Từ 2,000,000 = 2000000
 * @param {string} numberString  là chuỗi tiền tệ cần chuyển đổi
 */
const removeCommasHelpers = (numberString) => {
  const cleanedString = numberString.replace(/,/g, "");
  const number = parseInt(cleanedString, 10);
  return number;
};

/**Hàm có tác dụng format tiền tệ ở ô input 2000000 =>  2,000,000
 * @param {Number} input tiền cần format
 */
function formatNumberAndCheckEmpty(input) {
  validateNotEmpty(input);

  let value = input.value.replace(/\,/g, "");

  if (!isNaN(value) && value !== "") {
    input.value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

/**Hàm có tác dụng làm tròn đến số thập phân thứ n
 * @param {number} number số cần làm tròn
 * @param {number} n làm tròn đến số thập phân thứ bao nhiêu
 */
function roundToDecimalHelpers(number, n = 3) {
  const factor = Math.pow(10, n);
  return Math.round(number * factor) / factor;
}


/**hàm sử lý tiền tệ kèm thêm đơn vị"tiền VN"
 * @param {Number} price Nhận vào tiền chưa được định dạng
 */
function priceToText(price) {
  price = price || 0;
  let priceText = "";
  let priceUnit = "";

  if (price >= 1000000000) {
    priceText = numberFormatHelpers(price / 1000000000, 0);
    priceUnit = "Tỷ";
  } else if (price >= 1000000) {
    priceText = numberFormatHelpers(price / 1000000, 0);
    priceUnit = "Triệu";
  } else if (price >= 1000) {
    priceText = numberFormatHelpers(price / 1000, 0);
    priceUnit = "Nghìn";
  } else {
    priceText = numberFormatHelpers(price, 0);
  }
  priceUnit = priceUnit === "" ? "" : priceUnit;
  return `${priceText} ${priceUnit}`;
}

/**hàm có tác dụng tạo mã theo thời gian thường dùng cho số phiếu
 * @param codeDefault nhận vào  mã bắt đầu
 * @param dom nhận vào dom cần trả về
 */
const codeGenerationHelpers = (codeDefault = "MBT-PN", dom = "") => {
  // Lấy ngày giờ hiện tại
  const currentDate = new Date();

  // Lấy các thành phần của ngày giờ
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  // Kết hợp các thành phần thành chuỗi định dạng mong muốn
  let code = `${codeDefault}-${year + month + day + hours + minutes + seconds}`;
  if (dom) {
    document.querySelector(dom).value = code;
  }
  return code;
};


/**Hàm có tác dụng kiếm tra đầu ra có trống hay không
 * @param {String} output Dữ liệu bạn muốn kiểm tra
 * @param {string} [outputDefault=""] Dữ liệu mặc định nếu output không trống
 */
function checkOutput(output, outputDefault = "") {
  return output !== undefined && output !== null ? output : outputDefault;
}

/**Hàm có tác dụng nhận đưa ra số phiếu vào 1 thẻ nào đó sử dụng id
 * @param codeDefault nhận vào  mã bắt đầu
 * @param dom nhận vào dom cần trả về sử dụng id
 */
async function generateCode(codeDefault, dom) {
  dom = document.getElementById(dom);
  if (!check(dom)) return;
  try {
    const result = await codeAutoGenerationHelpers(codeDefault);
    dom.value = result;
  } catch (error) {
    console.error("Có lỗi xảy ra:", error);
  }
}

/**Hàm có tác dụng tạo ra mã theo kiểu tịnh tiến 
 * @param {string} baseCode là mã của từng loại phiếu
*/
async function codeAutoGenerationHelpers(baseCode = "PN-SX") {
  const request = new RequestServerHelpers("/api/so-phieu/id-moi-nhat");
  const response = await request.getData();
  if (response !== false) {
    let { id, date } = response.data;
    id += 1;
    let idStr = id.toString();
    let baseLength = 4; // Độ dài cơ sở của mã, ví dụ là 4
    // Nếu độ dài của idStr lớn hơn baseLength, không thay đổi gì
    if (idStr.length < baseLength) {
      idStr = idStr.padStart(baseLength, '0');
    }
    return `${baseCode}-${date}-${idStr}`;
  }
}

/**Hàm có tác dụng lấy ngày bắt đầu và kết thúc của tháng hiện tại trong phạm vi 1 tháng*/
function getDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());
      return `${day}-${month}-${year}`;
  };

  return `${formatDate(startOfMonth)} đến ${formatDate(now)}`;
}

export {removeCommasHelpers, codeAutoGenerationHelpers, generateCode, checkOutput, codeGenerationHelpers, priceToText, formatNumberAndCheckEmpty, roundToDecimalHelpers, getDateRange}