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

  // Kiểm tra nếu chuỗi có chứa dấu " - " (ngày bắt đầu và kết thúc)
  if (dateString.includes(" - ")) {
    // Tách chuỗi thành 2 ngày
    const [startDate, endDate] = dateString.split(" - ");
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } else {
    // Nếu chỉ có 1 ngày
    return formatDate(dateString);
  }
}

// Hàm phụ giúp chuyển đổi ngày về dạng YY-mm-dd
function formatDate(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
function formatDataResponse(res) {
  if (res.totalPages) {
    return res.data;
  }
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

function numberFormatHelpers(numberString, max = 0, groupSeparator = ",", decimalSeparator = ".") {
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

const dateTimeFormatHelpers = (date, format = "d/m/Y") => {
  let currentDate;
  if (date == "0000-00-00 00:00:00" || date == "0000-00-00" || date == "") {
    return "";
  }
  if (typeof date === "string" || typeof date === "number") {
    currentDate = new Date(date);
  } else {
    return "";
  }

  let seconds = currentDate.getSeconds().toString().padStart(2, "0"); // Add leading zero if needed
  let minutes = currentDate.getMinutes().toString().padStart(2, "0"); // Add leading zero if needed
  let hours = currentDate.getHours().toString().padStart(2, "0"); // Add leading zero if needed
  let day = currentDate.getDate().toString().padStart(2, "0"); // Add leading zero if needed
  let month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
  let year = currentDate.getFullYear();
  let result = format.replace("i", minutes);
  result = result.replace("s", seconds);
  result = result.replace("H", hours);
  result = result.replace("d", day);
  result = result.replace("m", month);
  result = result.replace("Y", year);
  return result;
};

// Hàm kiểm tra xem một object có rỗng hay không
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

/**
 * Hàm có tác dụng kiểm tra xem dom truyền vào có phải html hay không. Nếu không trả về document, có thì trả về dom
 */
function checkDom(dom) {
  // Kiểm tra xem dom có phải là một phần tử html hợp lệ không, nếu không mặc định là document
  return (dom instanceof HTMLElement || dom instanceof Document) ? dom : document;
}

/**
 * hàm có tác dụng kiểm tra thuộc tính của thẻ và thêm dữ liệu tương ứng cho nó
 * @param {dom} dom Thẻ cần sét dữ liệu
 * @param {*} value Dữ liệu được sét vào thẻ
 */
function applyAttributeData(dom, value, dataChoice, priceFormat, dateFormat) {
  // Lấy tên và loại của input
  const name = dom.name;
  const domType = dom.type;
  const isInputOrTextarea = dom.tagName === "INPUT" || dom.tagName === "TEXTAREA";

  // Xử lý radio và checkbox
  if (["radio", "checkbox"].includes(domType)) {
    const values = Array.isArray(value) ? value.map(String) : [String(value)];
    dom.checked = values.includes(String(dom.value));
  }

  // Xử lý Choices.js
  else if (dom.hasAttribute("data-choice")) {
    const id = dom.getAttribute("id");
    const choiceInstance = dataChoice[`#${id}`];
    if (!choiceInstance) {
      console.error(`Không tìm thấy id này #${id} ở trong form.`);
      return;
    }
    if (dom.multiple && Array.isArray(value)) {
      value.forEach(item => choiceInstance.setChoiceByValue(String(item)));
    } else {
      choiceInstance.setChoiceByValue(String(value));
    }
  }

  // Xử lý các loại input khác
  else {
    if (value) {
      if (Array.isArray(priceFormat) && priceFormat.includes(name)) {
        dom.value = numberFormatHelpers(value);
      } else if (Array.isArray(dateFormat) && dateFormat.includes(name)) {
        dom.value = dateTimeFormatHelpers(value);
      } else if (isInputOrTextarea) {
        dom.value = value;
      } else {
        dom.innerHTML = value;
      }
    }
  }
}

/**
 * hàm có tác dụng kiểm tra thuộc tính của thẻ và thêm dữ liệu tương ứng cho nó
 * @param {object} data Dữ liệu cần sét
 * @param {dom} form HTML element của tử trong form
 */
function setFormData(data, form, dataChoice, priceFormat, dateFormat) {
  // Lấy tất cả các phần tử trong form
  const elements = form.elements;

  for (let dom of elements) {
    let name = dom.getAttribute("name");
    // tìm kiếm và lấy dữ liệu của data dựa vào name thẻ
    if (name && data.hasOwnProperty(name)) {
      let value = data[name];
      applyAttributeData(dom, value, dataChoice, priceFormat, dateFormat)
    }
  }
}

/**
 * Hàm có tác dụng thực hiện lấy dữ liệu từ một dom được truyền vào. Chưa làm xong
 * @param {*} item 
 * @param {*} dataChoice 
 * @param {*} textSelect 
 * @returns 
 */
function getAttributeData(item, dataChoice, textSelect) {
  let data = {};
  if (item && typeof item === "object" && !item.tagName) {
    // Nếu thỏa mãn điều kiện, gán dữ liệu vào mảng data[key]
    data[key] = [];
    for (let subKey in item) {
      if (item.hasOwnProperty(subKey)) {
        let input = item[subKey];
        let value = input.value;
        if (input.checked) {
          if (input.type === "radio") {
            data[key] = value;
          } else {
            data[key].push(value);
          }
        }
      }
    }
  } else {
    let type = item.getAttribute("type");
    let name = item.getAttribute("name");

    if (type === "file") {
      if (item.multiple) {
        data[key] = item.files;
      } else {
        data[key] = item.files[0];
      }
    } else if (item.tagName === "SELECT" && item.multiple) {
      const id = item.getAttribute("id");
      const choiceSelect = dataChoice[`#${id}`];
      const value = choiceSelect.getValue().map(item => item.value);
      data[key] = value;
    } else {
      data[key] = (item instanceof HTMLElement) ? item.value.trim() : item.trim();
      // Lấy text của select nếu textSelect = true
      if (textSelect && item.tagName.toLowerCase() === "select") {
        data[`text_${name}`] = item.textContent;
      }
    }
  }
  return data;
}

/**
 * Hàm có tác dụng lấy dữ liệu từ một object dom và trả về một object data
 * @param {object} dom chứa các dom cần lấy dữ liệu
 * @param {object} dataChoice chứa các đối tượng choice đã được khởi tạo
 * @param {boolean} textSelect xác định xem có lấy nội dung bên trong thẻ select không. Mặc định là không
 * @returns 
 */
function getFormData(dom, dataChoice, textSelect = false) {
  let data = {};
  for (let key in dom) {
    if (dom.hasOwnProperty(key)) {
      let item = dom[key];
      if (item && typeof item === "object" && !item.tagName) {
        // Nếu thỏa mãn điều kiện, gán dữ liệu vào mảng data[key]
        data[key] = [];
        for (let subKey in item) {
          if (item.hasOwnProperty(subKey)) {
            let input = item[subKey];
            let value = input.value;
            if (input.checked) {
              if (input.type === "radio") {
                data[key] = value;
              } else {
                data[key].push(value);
              }
            }
          }
        }
      } else {
        let type = item.getAttribute("type");
        let name = item.getAttribute("name");

        if (type === "file") {
          if (item.multiple) {
            data[key] = item.files;
          } else {
            data[key] = item.files[0];
          }
        } else if (item.tagName === "SELECT") {
          const id = item.getAttribute("id");
          const choiceSelect = dataChoice[`#${id}`];
          let valueChoice = choiceSelect.getValue();
          // nếu thẻ select cho phép chọn nhiều thì lấy ra danh sách mảng dữ liệu đã chọn còn không thì lấy giá trị của thẻ select
          const value = item.multiple ? valueChoice.map(item => item.value) : valueChoice.value;
          data[key] = value;
          // Lấy text của select nếu textSelect = true
          if (textSelect && item.tagName.toLowerCase() === "select") {
            data[`text_${name}`] = item.textContent;
          }
        } else {
          data[key] = (item instanceof HTMLElement) ? item.value.trim() : item.trim();
        }
      }
    }
  }
  return data;
}

/**Hàm có tác dụng lấy ra toàn bộ các dom nhận vào dư liệu ở trong form. Và trả về object các dom đó
 * @param {HTML} scope phạm vi được được phép lấy dữ liệu
 */
function collectFormElements(scope) {
  const elements = scope.querySelectorAll("select, input, textarea");
  const dom = {};

  elements.forEach((item) => {
      let name = item.getAttribute("name");
      if (name) {
          if (item.type === "checkbox" || item.type === "radio") {
              // Nếu chưa tồn tại mảng cho checkbox thì khởi tạo
              if (!dom[name]) {
                  dom[name] = {};
              }
              // Thêm checkbox vào mảng
              dom[name][item.value] = item;
          } else {
              dom[name] = item;
          }
      }
  });
  return dom;
}
export { formatApiUrl, convertDateFormatHelpers, formatAPI, check, formatDataResponse, clearAllClassValidateHelpers, numberFormatHelpers, isEmptyObject, checkDom, applyAttributeData, setFormData, getAttributeData, getFormData, collectFormElements };