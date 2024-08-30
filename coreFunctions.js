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

export {formatApiUrl, convertDateFormatHelpers, formatAPI, check};