/**Hàm để format URL API với các tham số
 * @param {String} api Chỗi api
 * @param {Object} params Object các param muốn add vào api
 */
function formatApiUrl(api, params) {
  // Tách URL thành hai phần: phần cơ bản và phần query string
  let [baseUrl, queryString] = api.split("?");

  // Tạo một đối tượng URLSearchParams từ chuỗi query string hiện có
  let currentParams = new URLSearchParams(queryString);

  // Thêm hoặc cập nhật các tham số mới từ 'params'
  for (let key in params) {
    currentParams.set(key, params[key]);
  }

  // Tạo lại chuỗi query string mới từ các tham số đã cập nhật
  const updatedQueryString = currentParams.toString();

  // Trả về URL đã được cập nhật
  return `${baseUrl}?${updatedQueryString}`;
}
/**Hàm có tác dụng format thời gian để gửi lên database
* @param {string} dateString chuỗi thời gian theo dạng d-m-Y
*/
function convertDateFormatHelpers(dateString) {
const [day, month, year] = dateString.split("-");
return `${year}-${month}-${day}`;
}
/**format API. Hàm có tác dụng format lại API khi truyền quá nhiều param
* @param {string} -Nhận vào 1 chuỗi API
*/
function formatAPI(api) {
// Đầu tiên, tìm dấu ? đầu tiên và thay thế các dấu ? khác bằng &
let foundFirstQuestionMark = false;
let modifiedApi = api.replace(/\?(?=\w+=)/g, (match, offset) => {
  if (!foundFirstQuestionMark) {
    foundFirstQuestionMark = true;
    return match;
  }
  return "&";
});

// Tách API thành các tham số và giữ lại tham số cuối cùng với cùng tên
let params = modifiedApi.split("?");
let baseUrl = params[0];
let queryParams = params[1].split("&");
let paramMap = new Map();

queryParams.forEach((param) => {
  let [key, value] = param.split("=");
  paramMap.set(key, value);
});

// Tạo URL mới với các tham số đã được lọc
let newParams = Array.from(paramMap.entries())
  .map((entry) => entry.join("="))
  .join("&");
return `${baseUrl}?${newParams}`;
}

/**Hàm có tác dụng format data khi gọi response trả về. */
function formatDataResponse(res){
return res.data?.data?.length > 0 ? res.data.data : res.data;
}

function check(value, valueDefault, type = "dom") {
let status = true;
const message = {
  dom: "Không tìm thấy id hoặc class này: " + valueDefault,
  choice: "Vui lòng khởi tạo đối tượng choices này: " + valueDefault,
};
if (!value) {
  console.error(message[type]);
  status = false;
}
return status;
}

function clearAllClassValidateHelpers(element) {
// Lấy ra tất cả các phần tử trong biểu mẫu có class là "form-errors" hoặc "invalid" ...
let elementsWithErrors = element.querySelectorAll(
    ".form-error, .invalid, .valid, .form-success"
);
// Lặp qua từng phần tử và loại bỏ lớp "form-errors" và "invalid" ...
elementsWithErrors.forEach(function (ele) {
    ele.classList.remove("form-error");
    ele.classList.remove("invalid");
    ele.classList.remove("valid");
    ele.classList.remove("form-success");
});
let elementShowError = element.querySelectorAll(".show-error");
elementShowError.forEach((ele) => {
    ele.remove();
});
}

function numberFormatHelpers( numberString, max = 0, groupSeparator = ",", decimalSeparator = "."
) {
  const number = parseFloat(numberString);
  if (isNaN(number)) {
      throw new Error("Invalid number string");
  }
  const options = {
      minimumFractionDigits: 0,
      maximumFractionDigits: max,
      useGrouping: true,
  };
  const formattedNumber = number.toLocaleString("en-US", options);

  const customFormattedNumber = formattedNumber
      .replace(/,/g, groupSeparator)
      .replace(/\./g, decimalSeparator);

  return customFormattedNumber;
}

export {formatApiUrl, convertDateFormatHelpers, formatAPI, check, formatDataResponse, clearAllClassValidateHelpers, numberFormatHelpers};