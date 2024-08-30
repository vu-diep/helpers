import { formatApiUrl, convertDateFormatHelpers, formatAPI, check } from "./coreFunctions.js";
// xác định message trả về
const messageError = "errorMessage";
const messageSussces = "successMessage";

// class thao tác với server
class RequestServerHelpers {
  constructor(route) {
    this.route = route;
    this.params = {};
  }

  /**Hàm có tác dụng lấy ra dữ liệu
   * @param {string} [api=""] Nhận vào api lấy dữ liệu
   */
  async getData(api = "") {
    try {
      const formatAPI = api === "" ? this.route : api;
      const response = await axios.get(formatAPI, {
        params: this.params,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      showErrorMD("Vui lòng gọi IT");
      return false; // Trả về false khi có lỗi
    }
  }

  /**Hàm có tác dụng gửi dữ liệu
   * @param {string} [api=""] Nhận vào api gửi dữ liệu
   */
  async postData(api = "", data, debug = false) {
    try {
      const formatAPI = api === "" ? this.route : api;
      const response = await axios.post(formatAPI, data, {
        params: this.params,
      });
      if (debug) {
        console.log(response);
        return;
      }
      if (response.data.status >= 400) {
        showErrorMD(response.data[messageError]);
      } else {
        showMessageMD(response.data[messageSussces]);
      }
      return response.data; // Trả về dữ liệu thành công
    } catch (error) {
      console.error(error);
      showErrorMD("Vui lòng gọi IT");
      return false; // Trả về false khi có lỗi
    }
  }

  /**Hàm có tác dụng thực hiện gửi dữ liệu theo ý người dùng . Chỉ thực hiện gửi dữ liệu theo param với số lượng ít.
   * @param {string} [api=""] Nhận vào api xóa dữ liệu
   */
  async requestData(method, api = "") {
    try {
      const formatAPI = api === "" ? this.route : api;
      const response = await axios({
        method: method,
        url: formatAPI,
        params: this.params,
      });
      if (response.data.status === 200) {
        showMessageMD(response.data[messageSussces]);
        return response.data; // Trả về dữ liệu thành công
      } else {
        showErrorMD(response.data.error);
        throw new Error(response.data[messageError]); // Ném lỗi nếu response không thành công
      }
    } catch (error) {
      console.error(error);
      showErrorMD("Vui lòng gọi IT");
      return false; // Trả về false khi có lỗi
    }
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

//class làm việc với form
class FormHelpers extends RequestServerHelpers {
  /**
     * @param {string} formSelector Nhận vào id class của 1 form cần khởi tạo
     * @param {boolean} [startHandleFormSubmit=false] Xác định xem có tự động khởi tạo submit hay không 
     * @param {Đối tượng} layout  nhận vào đối tượng layout được khởi tạo
     * @param {Object} validations  nhận vào bản thiết kế các trường cần kiểm tra bao gồm
     * const validations = [
     {name: "tên thẻ", condition: value => điều kiện, message: "thông báo người dùng"},
     ]. Trong trường hợp bạn có các trường trong cùng 1 form cần validate với nhau thì thực hiện theo cách sau:
     const validations = [
        { 
            name: ["quanlityInResource", "kl_quy_doi"], 
            defaultName: "kl_xuat",
            condition: (quanlity_in_resource, kl_quy_doi) => Number(kl_quy_doi) <= Number(quanlity_in_resource), 
            message: "Khối lượng xuất không đủ" 
        },
    ];
     * @param {string} api api sẽ sử dụng cho form đó
     * @param {String} method  nhận vào method thực hiện gửi dữ liệu
     * @param {boolean} [debug=false]  được sử dụng để test api nếu là true thì sẽ dừng chương trình sau khi gọi api và console.log() response
     * value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id
     * subdata nhận vào object các trường cần bổ sung để gửi data. Dùng cho trường hợp trong form thiếu trường dữ liệu
     * notRest Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
     * priceFormat nhận vào mảng tên các thẻ cần format theo dạng tiền tệ
     * dateFormat nhận vào mảng tên các thẻ cần format theo dạng thời gian
     * [modalStatus=true] resetStatus Xác nhận việc thực hiện việc validate nếu false sẽ ngừng validate. Nếu truyền vào array thì nó sẽ không rest những trường có tên ở trong mảng đó
     * [modalStatus=true] phân biệt mở đóng modal hay không 
     * [table=false] phân biệt form thường với form có bảng 
     * exportExcel phân xem khi submit có xuất file excel. Nếu có xuất thì ghi đè với cú pháp sau:
     * exportExcel = {api: "API xuất file", name: "Tên file xuất"}
     * Lưu ý: Mặc định sẽ lấy phần data trả về làm param và gọi api để tải file. Phải khởi tạo layout và ghi đè layout trước khi ghi đè dữ liệu
     * responseHandler là một object. Được sử dụng sau khi ấn submit và sẽ chạy hàm bên trong object đó

     * Cú pháp: this.responseHandler = {code: "mã trả về. Điều kiện để chạy function", function: () => {}}

     */
  constructor(
    formSelector,
    startHandleFormSubmit = false,
    validations,
    api,
    method,
    layout,
    debug = false
  ) {
    super(api); // Gọi hàm khởi tạo của lớp cha
    this.form = document.querySelector(formSelector);
    this.api = api;
    if (!check(this.form, formSelector)) return;
    this.validations = validations;
    this.layout = layout;
    // sử dụng để biết xem khi submit có xuất file excel không
    this.exportExcel = false;
    this.value = "id";
    this.subdata = {};
    this.notRest = [];
    this.priceFormat = [];
    this.dateFormat = [];
    this.resetStatus = true;
    this.modalStatus = true;
    this.table = true;
    this.param = {};

    // lưu trữ khi khởi tạo choice
    this.choice = {};
    // lưu trữ modal khi khởi tạo
    this.loading = "";
    this.modal = "";
    this.newModal = "";

    // tự động khởi tạo choices khi khởi tạo FormHelpers
    this.startChoice();
    // tự động khởi tạo form submit
    if (startHandleFormSubmit)
      this.handleFormSubmit(method, this.layout, debug);
  }

  /**
   * khởi tạo choice
   * @param {string} choiceArray là mộ mảng chứa id của 1 thẻ
   */
  startChoice() {
    // Lấy tất cả các thẻ <select> bên trong form
    const selectElements = this.form.querySelectorAll("select");
    // Kiểm tra xem choiceArray có phải là một mảng và không rỗng
    if (selectElements.length > 0)
      selectElements.forEach((item) => {
        // Khởi tạo Choices cho phần tử
        const choiceInstance = new Choices(item, choiceOption);
        // Lưu trữ thông tin về phần tử và đối tượng Choices
        this.choice[`#${item.id}`] = choiceInstance;
      });
  }

  /**Lắng nghe sự change và gọi API của 1 thẻ select và đổ dữ liệu ra 1 thẻ select khác
   * @param {string} selectChange ID, Class của thẻ được chọn
   * @param {string} selectEeceive ID, Class của thẻ được nhận
   * @param {string} api api nhận lấy ra dữ liệu
   * @param {string} key là phần tham số mặc định cần gửi đi sau khi lắng nghe được sự kiện change,
   * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option. Trong trường hợp bạn có nhiều label thì hãy truyền theo dạng mảng
   * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
   * @param {Object} params là 1 object chứa các tùy chọn kèm theo khi gửi request
   * @param {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties. Các trường phụ này sẽ lưu vào thẻ selectEeceive
   * @param {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
   */
  eventListenerChange(
    selectChange,
    selectEeceive,
    api,
    key,
    label,
    labelDefault,
    customProperties = []
  ) {
    // Tìm đối tượng Choices cho selectChange và selectEeceive
    let choiceSelectEeceive = this.choice[selectEeceive];
    // Kiểm tra nếu đối tượng Choices tồn tại
    if (!check(choiceSelectEeceive, selectEeceive, "choice")) return;

    // Thêm sự kiện change cho selectChange
    this.eventListenerChangeGetData(selectChange, async (e) => {
      // xóa bỏ giá trị đã được chọn cũ
      choiceSelectEeceive.clearStore();
      // Hiển thị trạng thái loading
      choiceSelectEeceive._handleLoadingState(true);
      // Gửi yêu cầu GET đến API
      this.params = { [key]: e, ...this.param };
      let res = await this.getData(api);
      if (res.status !== 200) {
        showErrorMD("Không có dữ liệu bạn cần tìm");
        choiceSelectEeceive._handleLoadingState(false);
        choiceSelectEeceive.setChoices(
          [{ value: "", label: labelDefault }],
          "value",
          "label",
          true
        );
        return;
      }
      let data = res.data?.data?.length > 0 ? res.data.data : res.data;

      let dataChoice = data.map((item) => {
        let labelValue;
        if (Array.isArray(label)) {
          // Nếu label là mảng, kết hợp các giá trị từ các trường được chỉ định
          labelValue = label.map((lbl) => item[lbl]).join("-");
        } else {
          // Nếu label là một chuỗi, lấy giá trị của trường đó
          labelValue = item[label];
        }

        let customProps = {};
        if (Array.isArray(customProperties) && customProperties.length > 0) {
          customProperties.forEach((prop) => {
            if (item.hasOwnProperty(prop)) {
              customProps[prop] = item[prop];
            }
          });
        }
        return {
          label: labelValue,
          value: item[this.value],
          customProperties: customProps,
        };
      });

      // thêm giá trị mặc định
      dataChoice.unshift({ value: "", label: labelDefault });
      // trả dữ liệu về thẻ sleect
      choiceSelectEeceive.setChoices(dataChoice, "value", "label", true);
      choiceSelectEeceive._handleLoadingState(false);
    });
  }

  /**Lắng nghe sự change và gọi API của 1 thẻ select và đổ dữ liệu ra 1 thẻ khác
     * @param {string} selectChange ID, Class của thẻ được chọn
     * @param {string} receive ID, Class của thẻ được nhận. Nếu bạn có nhiều nơi cần nhận dữ liệu đồng nghĩa với việc bạn đã lưu dữ liệu vào customProperties thì hãy truyền receive theo cách sau:
     * const received = [
            {dom: "#ratio", value: "ratio" },
            {dom: "#price", value: "price" },
        ];
     * @param {string} value là phần muốn hiển thị sau khi gọi api hoặc lấy dữ liệu từ customProperties,
     * @param {string} api api nhận lấy ra dữ liệu, trong trường hợp bạn đã lưu dữ liệu vào customProperties thì không cần truyền api và key
     * @param {string} key nhận vào param của api,
     */
  eventListenerChangeForData(selectChange, receive, value, api = "", key = "") {
    // Lấy phần tử DOM cho selectChange
    const domSelectChange = document.querySelector(selectChange);
    if (!check(domSelectChange, selectChange)) return;

    // Kiểm tra xem receive là mảng hay chuỗi và thiết lập domReceive
    const isReceiveArray = Array.isArray(receive);
    const domReceive = isReceiveArray ? null : document.querySelector(receive);

    if (!isReceiveArray && !domReceive) {
      console.error("Không tìm thấy id hoặc class này: " + receive);
      return;
    }

    // Hàm xử lý cập nhật dữ liệu vào domReceive hoặc danh sách domReceive
    const updateReceive = (data) => {
      if (isReceiveArray) {
        receive.forEach((item) => {
          const dataCustomProperties = data[item.value];
          let dom = document.querySelector(item.dom);
          this.updateDomReceive(dom, dataCustomProperties);
        });
      } else if (api) {
        this.updateDomReceive(domReceive, data[value]);
      } else {
        this.updateDomReceive(domReceive, data);
      }
    };

    // Thêm sự kiện change cho selectChange
    domSelectChange.addEventListener("addItem", async (e) => {
      let selectedChoice = e.detail;

      if (!selectedChoice || !selectedChoice.customProperties) {
        console.error("Lựa chọn không có customProperties.");
        return;
      }

      if (api) {
        // Hiển thị trạng thái "Đang tìm kiếm"
        this.updateDomReceive(domReceive, "Đang tìm kiếm");

        try {
          // Gửi yêu cầu GET đến API
          const res = await this.getData(`${api}?${key}=${e.target.value}`);
          let dataToDisplay = "Không tìm thấy dữ liệu";

          if (res.status === 200) {
            const data = res.data?.data?.length > 0 ? res.data.data : res.data;
            if (data) {
              dataToDisplay = data[value];
            }
          }

          updateReceive(dataToDisplay);
        } catch (error) {
          console.error("Lỗi khi gọi API: ", error);
          this.updateDomReceive(domReceive, "Lỗi khi tìm kiếm dữ liệu");
        }
      } else if (isReceiveArray) {
        const dataCustomProperties = selectedChoice.customProperties;
        updateReceive(dataCustomProperties);
      } else {
        updateReceive(e.target.value);
      }
    });
  }

  /**Hàm có tác dụng lắng nghe sự kiện change của 1 thẻ select và trả về dữ liệu của thẻ đó
   * @param {string} selectChange ID, Class của thẻ được chọn
   * @param {callback} callback là một dùng để lấy ra dữ liệu
   */
  eventListenerChangeGetData(selectChange, callback) {
    const domSelectChange = document.querySelector(selectChange);
    if (!check(domSelectChange, selectChange)) return;

    // Xóa bỏ event listener cũ (nếu có)
    const newCallback = async (e) => {
      const value = e.target.value;
      if (callback) callback(value); // Gọi callback với giá trị
    };

    domSelectChange.removeEventListener("change", domSelectChange._callback);
    domSelectChange._callback = newCallback;

    domSelectChange.addEventListener("change", newCallback);
  }

  // Hàm cập nhật domReceive tùy theo loại thẻ hàm dùng nội bộ
  updateDomReceive(domReceive, content) {
    if (domReceive.tagName === "INPUT" || domReceive.tagName === "TEXTAREA") {
      domReceive.value = checkOutput(content);
    } else {
      domReceive.innerHTML = checkOutput(content);
    }
  }

  /**Lắng nghe sự kiện tìm thêm dữ liệu
   * @param {string} select ID, Class của thẻ được chọn
   * @param {string} api api nhận lấy ra dữ liệu
   * @param {string} key nhận vào param của api,
   * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option
   * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
   * @param {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties.
   * @param {string} params là 1 object chứa các tùy chọn kèm theo khi gửi request
   * @param {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
   */
  async selectMore(
    select,
    api,
    key,
    label,
    labelDefault,
    customProperties = [],
    params = {}
  ) {
    let myTimeOut = null;
    let selectDom = document.querySelector(select);
    let choiceSelect = this.choice[select];
    if (!check(selectDom, select)) return;
    if (!check(choiceSelect, select, "choice")) return;

    // Lắng nghe sự kiện tìm kiếm
    selectDom.addEventListener("search", async (e) => {
      let query = e.detail.value.trim();
      clearTimeout(myTimeOut);

      myTimeOut = setTimeout(async () => {
        choiceSelect.setChoiceByValue("");
        choiceSelect._handleLoadingState();

        try {
          this.params = { [key]: query, ...params };
          let res = await this.getData(api);
          if (res.status !== 200) {
            showErrorMD("Không tìm thấy dữ liệu bạn cần");
            choiceSelect._handleLoadingState(false); // Tắt trạng thái loading
            return;
          }
          let data = res.data?.data?.length > 0 ? res.data.data : res.data;

          let choiceData = data.map((item) => {
            let labelValue;
            if (Array.isArray(label)) {
              // Nếu label là mảng, kết hợp các giá trị từ các trường được chỉ định
              labelValue = label.map((lbl) => item[lbl]).join("-");
            } else {
              // Nếu label là một chuỗi, lấy giá trị của trường đó
              labelValue = item[label];
            }

            let customProps = {};
            if (
              Array.isArray(customProperties) &&
              customProperties.length > 0
            ) {
              customProperties.forEach((prop) => {
                if (item.hasOwnProperty(prop)) {
                  customProps[prop] = item[prop];
                }
              });
            }

            return {
              label: labelValue,
              value: item[this.value],
              customProperties: customProps,
            };
          });

          // Thêm giá trị mặc định
          choiceData.unshift({ value: "", label: labelDefault });
          choiceSelect.setChoices(choiceData, "value", "label", true); // Đổ dữ liệu mới vào select
          choiceSelect._handleLoadingState(false); // Tắt trạng thái loading
          choiceSelect.input.element.focus(); // Trả lại focus cho ô input của Choices
        } catch (error) {
          console.error("There was an error!", error);
          choiceSelect._handleLoadingState(false); // Tắt trạng thái loading ngay cả khi có lỗi
        }
      }, 500);
    });
  }

  /**Đổ dữ liệu vào thẻ select choices thông qua api
   * @param {string} select ID của thẻ được chọn
   * @param {string} api api nhận lấy ra dữ liệu
   * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option
   * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
   * @param {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties.
   * @param {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
   */
  async selectData(select, api, label, labelDefault, customProperties = []) {
    // Tìm đối tượng Choices cho selectChange và select
    let choiceSelect = this.choice[select];
    // Kiểm tra nếu đối tượng Choices tồn tại
    if (choiceSelect) {
      choiceSelect._handleLoadingState(true);
      let res = await this.getData(api);
      if (res.status === 200) {
        let data = res.data.data?.length > 0 ? res.data.data : res.data;

        let dataChoice = data.map((item) => {
          let labelValue;
          if (Array.isArray(label)) {
            // Nếu label là mảng, kết hợp các giá trị từ các trường được chỉ định
            labelValue = label.map((lbl) => item[lbl]).join("-");
          } else {
            // Nếu label là một chuỗi, lấy giá trị của trường đó
            labelValue = item[label];
          }

          let customProps = {};
          if (Array.isArray(customProperties) && customProperties.length > 0) {
            customProperties.forEach((prop) => {
              if (item.hasOwnProperty(prop)) {
                customProps[prop] = item[prop];
              }
            });
          }

          return {
            label: labelValue,
            value: item[this.value],
            customProperties: customProps,
          };
        });
        // thêm giá trị mặc định
        dataChoice.unshift({ value: "", label: labelDefault });
        // trả dữ liệu về thẻ select
        choiceSelect.setChoices(dataChoice, "value", "label", true);
      }
      choiceSelect._handleLoadingState(false);
    } else {
      console.error("Không có đối tượng choices này: " + select);
    }
  }

  reset() {
    // Lấy tất cả các phần tử trong form
    const elements = this.form.elements;
    for (let item of elements) {
      // Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
      if (this.notRest.includes(item.name)) continue;

      // kiểm tra đối tượng choice
      if (item.hasAttribute("data-choice")) {
        let id = item.getAttribute("id");
        // Tìm đối tượng Choices
        let choiceInstance = this.choice[`#${id}`];
        if (choiceInstance) choiceInstance.setChoiceByValue(""); // Xóa các lựa chọn hiện tại
      } else {
        if (item.tagName === "INPUT" || item.tagName === "TEXTAREA")
          item.value = ""; // Đặt lại giá trị của các phần tử input, select, textarea
      }
    }
    clearAllClassValidate(this.form);
  }

  /** Hàm có tác dụng validate  form
   * @param {String} textSelect nếu là false thì sẽ trả về mảng dữ liệu, ngược lại thì trả về nội dung thẻ select đã được chọn
   */
  validate(textSelect = false) {
    const dom = {};
    const data = {};
    // Lấy ra form và kiểm tra xem form có tồn tại không
    const form = this.form;
    if (!form) {
      console.error(`Form with id ${this.form} not found.`);
      return false; // Trả về false nếu không tìm thấy form
    }

    let selects = form.querySelectorAll("select");
    let inputs = form.querySelectorAll("input");
    let textareas = form.querySelectorAll("textarea");

    // Thu thập tất cả các thẻ select, input, textarea vào đối tượng dom
    let collectElements = (elements) => {
      elements.forEach((item) => {
        let name = item.getAttribute("name");
        if (name) {
          dom[name] = item;

          // Nếu thẻ là select, thêm text đã chọn vào dom
          if (textSelect && item.tagName.toLowerCase() === "select")
            dom[`text_${name}`] = item.textContent;
        }
      });
    };

    collectElements(selects);
    collectElements(inputs);
    collectElements(textareas);

    // Kiểm tra dựa theo bảng thiết kế
    for (let validate of this.validations) {
      let { name, defaultName, condition, message } = validate;
      // Kiểm tra điều kiện cơ bản
      if (Array.isArray(name)) {
        // Xử lý quy tắc cần nhiều tham số
        // Trường hợp name là một mảng
        let fieldValues = name.map((item) => dom[item]?.value);
        if (fieldValues.every((value) => value !== undefined)) {
          if (!condition(...fieldValues)) {
            name.forEach((name) => {
              let field = "";
              if (defaultName) {
                field = dom[defaultName];
              } else {
                field = dom[name];
              }
              if (field) {
                changeValidateMessage(field, true, message, ["p-2", "small"]);
              }
            });
            return false;
          }

          name.forEach((name) => {
            let field = "";
            if (defaultName) {
              field = dom[defaultName];
            } else {
              field = dom[name];
            }
            if (field) {
              changeValidateMessage(field, false, "", []);
            }
          });
        }
      } else {
        let field = dom[name];
        if (field) {
          if (!condition(field.value)) {
            changeValidateMessage(field, true, message, ["p-2", "small"]);
            return false;
          }
          // Kiểm tra nếu có thuộc tính min-custom
          if (field.getAttribute("min-custom")) {
            let minValue = parseFloat(field.getAttribute("min-custom"));
            if (parseFloat(field.value) < minValue) {
              changeValidateMessage(
                field,
                true,
                `Số lượng phải lớn hơn hoặc bằng ${minValue}`,
                ["p-2", "small"]
              );
              return false;
            }
          }

          // Kiểm tra nếu có thuộc tính max-custom
          if (field.getAttribute("max-custom")) {
            let maxValue = parseFloat(field.getAttribute("max-custom"));
            if (parseFloat(field.value) > maxValue) {
              changeValidateMessage(
                field,
                true,
                `Số lượng phải nhỏ hơn hoặc bằng ${maxValue}`,
                ["p-2", "small"]
              );
              return false;
            }
          }

          // Nếu không có lỗi nào, xóa thông báo lỗi
          changeValidateMessage(field, false, "", []);
        }
      }
    }

    // Nếu tất cả các kiểm tra đều thành công, thu thập dữ liệu từ các trường
    for (let key in dom) {
      let item = dom[key];
      if (item instanceof HTMLElement) {
        // Nếu item là DOM element, lấy giá trị của nó
        data[key] = item.value;
      } else {
        // Nếu không phải là DOM element, trả về item trực tiếp
        data[key] = item;
      }
    }

    return data;
  }

  /**Hàm có tác dụng validate form nằm trong table
   * @param {String} tbody  Nhận vào id, class của tbody
   */
  validateRow(tbody) {
    const dom = [];
    const data = [];

    // Lấy ra form và kiểm tra xem form có tồn tại không
    const form = this.form;
    if (!form) {
      console.error(`Form with id ${this.form} not found.`);
      return false; // Trả về false nếu không tìm thấy form
    }

    const tbodyElement = document.querySelector(tbody);
    if (!tbodyElement) {
      console.error(`Tbody with selector '${tbody}' not found.`);
      return false; // Ngăn chặn lỗi tiếp theo
    }

    // Thu thập tất cả các thẻ select, input, textarea vào đối tượng dom
    const collectElements = (elements, rowData) => {
      elements.forEach((item) => {
        let name = item.getAttribute("name");
        if (name) {
          rowData[name] = item;
        }
      });
    };

    let rows = tbodyElement.querySelectorAll("tr");

    rows.forEach((row) => {
      let rowData = {}; // Tạo một đối tượng cho mỗi hàng

      let selects = row.querySelectorAll("select");
      let inputs = row.querySelectorAll("input");
      let textareas = row.querySelectorAll("textarea");

      collectElements(selects, rowData);
      collectElements(inputs, rowData);
      collectElements(textareas, rowData);

      dom.push(rowData); // Thêm đối tượng hàng vào mảng dom
    });
    // Kiểm tra dựa theo bảng thiết kế
    for (let { name, condition, message } of this.validations) {
      let isValid = true; // Biến để theo dõi trạng thái hợp lệ của hàng

      for (let item of dom) {
        let field = item[name]; // Lấy giá trị từ đối tượng hàng
        if (field) {
          if (!condition(field.value)) {
            changeValidateMessage(field, true, message, ["p-2", "small"]);
            isValid = false; // Đánh dấu rằng kiểm tra không thành công
          }

          // Kiểm tra nếu có thuộc tính min-custom
          if (field.getAttribute("min-custom")) {
            let minValue = parseFloat(field.getAttribute("min-custom"));
            if (parseFloat(field.value) < minValue) {
              changeValidateMessage(
                field,
                true,
                `Số lượng phải lớn hơn hoặc bằng ${minValue}`,
                ["p-2", "small"]
              );
              isValid = false;
            }
          }

          // Kiểm tra nếu có thuộc tính max-custom
          if (field.getAttribute("max-custom")) {
            let maxValue = parseFloat(field.getAttribute("max-custom"));
            if (parseFloat(field.value) > maxValue) {
              changeValidateMessage(
                field,
                true,
                `Số lượng phải nhỏ hơn hoặc bằng ${maxValue}`,
                ["p-2", "small"]
              );
              isValid = false;
            }
          }

          // Nếu không có lỗi nào, xóa thông báo lỗi
          if (isValid) {
            changeValidateMessage(field, false, "", []);
          }
        }
      }

      if (!isValid) {
        return false; // Trả về false nếu có lỗi
      }
    }
    // Nếu tất cả các kiểm tra đều thành công, thu thập dữ liệu từ các trường
    dom.forEach((rowData) => {
      let rowValues = {};
      for (let key in rowData) {
        rowValues[key] = rowData[key].value;
      }
      data.push(rowValues); // Thêm đối tượng hàng vào mảng data
    });

    return data;
  }

  /**thực hiện khởi tạo modal
   * @param {String} modal nhận vào 1 id, class modal
   * @param {String} loading nhận vào 1 id class của 1 loadding
   * @param {String} show nhận vào 1 id class của 1 button lắng nghe sự kiện mở modal. Nếu bạn để nó là rỗng thì nó sẽ tự động khởi tạo modal
   * @param {array} dataDefault là một mảng chứa các object mục đích khi khởi tạo dữ liệu sẽ được gắn vào form
   * Ví dụ:
   * dataDefault = [
   * { dom: "Id hoặc class đổ ra dữ liệu mặc định", value: "Dữ liệu mặc định"},
   * ]
   */
  startModal(modal, show = "", dataDefault = []) {
    const openModal = () => {
      this.modal = document.querySelector(modal);
      if (!check(this.modal, modal)) return;
      this.newModal = new bootstrap.Modal(this.modal, {});

      // Tạo phần tử loading và thêm vào modal
      this.loading = document.createElement("div");
      this.loading.className = "spinner-border text-info spinner-border-sm";
      this.loading.role = "status";
      this.loading.innerHTML =
        '<span class="visually-hidden">Loading...</span>';

      this.loading.style.position = "absolute";
      this.loading.style.top = "15%";
      this.loading.style.left = "50%";

      this.modal.querySelector(".modal-body").appendChild(this.loading);

      // Khởi tạo modal và hiển thị phần loading
      this.newModal.show();
      this.loading.style.display = "block"; // Hiển thị loading
      // Ngừng loading sau khi modal đã được hiển thị
      this.modal.addEventListener("shown.bs.modal", () => {
        this.loading.style.display = "none"; // Ẩn loading khi modal đã hiển thị
        this.form.style.display = "flex"; // Hiển thị form

        if (dataDefault.length > 0) {
          dataDefault.forEach(async (item) => {
            const element = document.querySelector(item.dom);
            if (element) {
              // Kiểm tra xem phần tử có tồn tại không
              let value;
              if (typeof item.value === "function") {
                // Kiểm tra nếu item.value là hàm và gọi nó với await
                value = await item.value();
              } else {
                value = item.value;
              }
              if (
                element.tagName === "INPUT" ||
                element.tagName === "TEXTAREA" ||
                element.tagName === "SELECT"
              ) {
                element.value = value; // Gán giá trị cho các phần tử input, textarea, select
              } else {
                element.textContent = value; // Gán giá trị cho các phần tử khác (như div, span)
              }
            } else {
              console.error("Không có phần tử này: " + item + " trong dom");
            }
          });
        }
      });

      // Đảm bảo closeModal được gọi sau khi modal được khởi tạo
      this.modal.addEventListener("hidden.bs.modal", (e) => {
        this.reset();
        this.newModal.hide();
      });
    };

    if (show) {
      const element = document.querySelector(show);

      if (element) {
        // Kiểm tra nếu phần tử tồn tại
        element.addEventListener("click", openModal);
      }
    } else {
      openModal();
    }
  }

  /**Hàm có tác dụng khởi tạo modal edit và đổ ra dữ liệu
   * @param {String} modal nhận vào 1 id, class modal
   * @param {Object} params nhận vào object param
   */
  async startModalEdit(modal, params = {}) {
    try {
      // Mở modal
      this.modal = document.querySelector(modal);
      if (!check(this.modal, modal)) return;
      this.newModal = new bootstrap.Modal(this.modal, {});
      // Tạo phần tử loading và thêm vào modal
      this.loading = document.createElement("div");
      this.loading.className = "spinner-border text-info spinner-border-sm";
      this.loading.role = "status";
      this.loading.innerHTML =
        '<span class="visually-hidden">Loading...</span>';

      this.loading.style.position = "absolute";
      this.loading.style.top = "15%";
      this.loading.style.left = "50%";

      this.modal.querySelector(".modal-body").appendChild(this.loading);

      this.params = params;
      let response = await this.getData(this.api);
      this.newModal.show();

      // loading sau khi modal đã được hiển thị
      this.newModal._element.addEventListener("shown.bs.modal", () => {
        if (response.status !== 200) {
          // Xử lý trường hợp khi API trả về mã lỗi khác 200
          showErrorMD("Đã xảy ra lỗi khi lấy dữ liệu vui lòng thử lại.");
          return;
        }
        let data = response.data?.data?.length
          ? response.data.data[0]
          : response.data[0];

        // Lấy tất cả các phần tử trong form
        const elements = this.form.elements;

        for (let item of elements) {
          const name = item.getAttribute("name");
          // tìm kiếm và lấy dữ liệu của data dựa vào name thẻ
          if (name && data.hasOwnProperty(name)) {
            let value = data[name];

            // Kiểm tra nếu phần tử là Choices instance và cập nhật Choices
            if (item.hasAttribute("data-choice")) {
              let id = item.getAttribute("id");
              let choiceInstance = this.choice[`#${id}`];
              choiceInstance.setChoiceByValue(String(value));
            } else {
              // Kiểm tra và áp dụng định dạng giá hoặc thời gian
              if (this.priceFormat.includes(name)) {
                item.value = numberFormat(value);
              } else if (this.dateFormat.includes(name)) {
                item.value = dateTimeFormat(value);
              } else {
                item.value = value;
              }
            }
          }
        }
      });
    } catch (error) {
      // Xử lý ngoại lệ trong quá trình thực thi
      console.error("Error during startModalEdit:", error);
      showErrorMD("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      // Ẩn loading và hiển thị form sau khi tất cả quá trình hoàn thành
      this.loading.style.display = "none"; // Ẩn loading khi modal đã hiển thị
      this.form.style.display = "flex"; // Hiển thị form
      // Đảm bảo closeModal được gọi sau khi modal được khởi tạo
      this.modal.addEventListener("hidden.bs.modal", () => {
        this.reset();
        this.newModal.hide();
        this.loading.style.display = "none"; // Ẩn loading khi modal đã hiển thị
        this.form.style.display = "flex"; // Hiển thị form
      });
    }
  }

  /**Hàm có tác dụng gửi thông tin form
   * @param {string} api Nhận vào ip thực hiện việc gửi dữ liệu
   * @param {boolean} [debug=false]  được sử dụng để test api
   */
  async submitForm(method, debug = false) {
    try {
      let data =
        this.table === true ? this.validate() : this.validateRow(this.table);
      if (data !== false) {
        // Kiểm tra xem subdata có trống  hay không
        if (Object.keys(this.subdata).length > 0) {
          // Nếu subdata là mảng, nối nó với data
          data = { ...data, ...this.subdata };
        }

        // format dữ liệu trước khi gửi đi
        if (this.priceFormat.length > 0) {
          this.priceFormat.forEach((name) => {
            if (data.hasOwnProperty(name)) {
              // Kiểm tra xem data có thuộc tính này không
              data[name] = removeCommasHelpers(data[name]); // Thực hiện định dạng lại dữ liệu
            }
          });
        }

        if (this.dateFormat.length > 0) {
          this.dateFormat.forEach((name) => {
            // Sử dụng dateFormat thay vì priceFormat
            if (data.hasOwnProperty(name)) {
              // Kiểm tra xem data có thuộc tính này không
              data[name] = convertDateFormatHelpers(data[name]); // Thực hiện định dạng lại dữ liệu
            }
          });
        }

        const res = await axios({
          method: method,
          url: this.api,
          data: data,
          params: this.params,
        });

        if (debug) {
          console.log(res);
          return false;
        }
        // nếu có yêu cầu sau gì đó sau khi gọi api, kiểm tra status có trùng với yêu cầu không, thực hiện gọi hàm đó

        if (this.responseHandler) if (this.responseHandler.status === res.data.status) this.responseHandler.function();

        // Kiểm tra trạng thái trả về
        if (res.data.status >= 400) {
          showErrorMD(res.data[messageError]);
          return false;
        }

        // Hiển thị thông điệp thành công và thực hiện các thao tác cần thiết
        showMessageMD(res.data[messageSussces]);

        if (this.modalStatus) {
          // Ẩn form và đóng modal
          this.form.style.display = "none";
          this.newModal.hide();
        }

        // Trả về đối tượng kết quả
        return { status: true, data: res.data.data };
      }
    } catch (err) {
      // Xử lý lỗi
      showErrorMD("Vui lòng gọi IT");
      console.error(err);

      return { status: false, error: err };
    }
  }

  /**Hàm có tác dụng lắng nghe sự kiện submit của form
   * @param {String} method  nhận vào method thực hiện gửi dữ liệu
   * @param {Đối tượng} layoutInstance  nhận vào đối tượng layout được khởi tạo
   * @param {boolean} [debug=false]  được sử dụng để test api nếu là true thì sẽ dừng chương trình sau khi gọi api và console.log() response
   */
  handleFormSubmit(method, layoutInstance, debug = false) {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // lấy ra thẻ button có type submit
      const submitButton = this.form.querySelector('button[type="submit"]');
      const submitButtonTextContent = submitButton.textContent;
      btnLoading(submitButton, true);
      let response = await this.submitForm(method, debug);
      btnLoading(submitButton, false, submitButtonTextContent);
      if (response && response.status) {
        await layoutInstance.dataUI();
        if (this.resetStatus === true) {
          this.reset();
        }
        if (this.exportExcel) {
          let api = `${this.exportExcel.api}${response.data}`;
          this.layout.exportExcel("", api, this.exportExcel.name);
        }
      }
    });
  }
}
// class thao tác với param trên url
class URLHelpers {
  constructor(url = window.location.href) {
    this.url = new URL(url);
  }
  setUrl(url) {
    this.url = new URL(url);
  }
  getQueryString() {
    return this.url.search;
  }
  getLastPathSegment() {
    const parts = this.url.pathname.split("/");
    return parts.pop();
  }

  getParams() {
    // Lấy URL hiện tại từ window.location
    const params = new URLSearchParams(window.location.search);
    const paramList = {};
    for (const [key, value] of params.entries()) {
      paramList[key] = value;
    }
    return paramList;
  }

  /**Hàm có tác dụng xóa param trên url
   * @param key Nhận vào key của param đó
   */
  removeParam(key) {
    // Lấy URL hiện tại
    var url = window.location.href;

    // Tạo một URL không có tham số cần xóa
    var urlWithoutParam = url
      .replace(new RegExp("[?&]" + key + "=[^&#]*(#.*)?$"), "$1")
      .replace(new RegExp("([?&])" + key + "=[^&]*&"), "$1");

    // Nếu URL đã thay đổi, cập nhật URL mới
    if (urlWithoutParam !== url) {
      window.history.replaceState(
        { path: urlWithoutParam },
        "",
        urlWithoutParam
      );
    }
  }

  /**Hàm có tác dụng xóa các param trên url. Nhưng sẽ không xóa các param được truyền vào
   * @param {array} keysToKeep nhận vào tên các param không cần xóa
   */
  removeParamsExcept(keysToKeep) {
    let url = window.location.href;
    let urlObj = new URL(url);
    let params = new URLSearchParams(urlObj.search);

    // Lặp qua các tham số hiện tại trong URL
    for (let key of params.keys()) {
      if (!keysToKeep.includes(key)) {
        params.delete(key); // Xóa tham số không nằm trong danh sách keysToKeep
      }
    }

    // Cập nhật URL mới với các tham số đã được xóa
    urlObj.search = params.toString();
    let newUrl = urlObj.toString();

    // Đổi đến URL mới nếu URL đã thay đổi
    if (newUrl !== url) {
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }

  /** hàm có tác dụng thêm param vào url
   * @param {object} paramas nhận vào object chứa các param muốn truyền
   * ví dụ: { key1: value1, key2: value2 }
   * @param {string} [url=""] nhận vào chuỗi url. Nếu url không trống thì chuyển hướng đến trang đích
   */
  addParamsToURL(params, url = "") {
    let currentURL;

    try {
      if (url) {
        // Xử lý URL tương đối bằng cách kết hợp với `window.location.origin`
        currentURL = new URL(url, window.location.origin);
      } else {
        // Nếu không có URL nào được cung cấp, sử dụng URL hiện tại
        currentURL = new URL(window.location.href);
      }
    } catch (error) {
      console.error("Invalid URL:", url);
      return;
    }

    // Thêm các tham số vào URL
    for (const key in params) {
      currentURL.searchParams.set(key, params[key]);
    }

    if (url) {
      // Chuyển hướng đến URL mới nếu có URL được cung cấp
      window.location.href = currentURL.href;
    } else {
      // Cập nhật URL hiện tại mà không tải lại trang
      window.history.pushState({}, "", currentURL.href);
    }
    currentURL = "";
  }

  /**Hàm có tác dụng cập nhật 1 param trên url
   * @param {string} param key trên url
   * @param {all} value dữ liệu mới cần cập nhật
   */
  updateUrlParameter(param, value) {
    // Cập nhật hoặc thêm tham số vào URL
    this.url.searchParams.set(param, value);

    // Cập nhật URL trong thanh địa chỉ mà không tải lại trang
    window.history.pushState({}, "", url);
  }

  /**Hàm có tác dụng xóa toàn bộ param của 1 url được truyền vào
   * @param {String} url url chứa các param cần xóa
   */
  removeAllParams(url) {
    // Tách URL thành hai phần: phần cơ bản và phần query string (nếu có)
    let [baseUrl] = url.split("?");

    // Trả về chỉ phần cơ bản của URL, tức là đã loại bỏ tất cả các tham số
    return baseUrl;
  }
}

// class thao tác với confim
class ConfirmHelpers {
  config = {
    text: "Bạn có chắc chắn muốn xóa không?",
    btnText: "Xóa",
    btnBg: "red",
    title: "Xóa",
    success: async () => { },
  };

  constructor() {
    this.modal = document.getElementById("modalConfirmDelete");
    this.btnConfirm = this.modal.querySelector(".btn-confirm");
    this.modalBT = new bootstrap.Modal(this.modal, { keyboard: false });
    this.element = this.modal.querySelector(".confirm-message");

    this.btnConfirm.addEventListener("click", async (e) => {
      let originalText = this.btnConfirm.textContent;
      await this.loading(true, originalText);
      let response = await this.config.success(e);
      // nếu thực hiện thành công
      if (response && response.status) {
        await this.loading(false, originalText);
        this.hide();
      }
    });
  }

  loading(type = false, text = "") {
    btnLoading(this.btnConfirm, type, text);
  }

  hide() {
    this.modalBT.hide();
  }

  show() {
    this.btnConfirm.style.backgroundColor = this.config.btnBg;
    this.element.textContent = this.config.text;
    this.btnConfirm.textContent = this.config.btnText;
    this.btnConfirm.setAttribute("title", this.config.title);

    this.modalBT.show();
  }
}

// class làm việc với layout
class LayoutHelpers extends URLHelpers {
  /**
     * @constructor 
     * @param {string, Array} api thực hiện gọi api, Nếu bạn có nhiều api thì hãy truyền dạng mảng. Dữ liệu sau khi trả về sẽ được gom lại thành 1 mảng chứa các object bên trong. Đối với api đầu tiên sẽ là api chính tức là: phân trang, lọc sẽ chỉ hoạt động ở api đầu tiên
     * @param {HTMLFormElement} form nơi đổ ra dữ liệu cần hiển thị
     * @param {Callback} template là một callback trả về html dựa theo mảng data truyền vào
     * @param {number} colspan số cột cần gộp nếu có lỗi
     * @param {boolean, Array} total phân biệt có hiển thị tính tổng số lượng hay không
     * [
     *  {dom: id thẻ nhận dữ liệu, key: key khi trả về từ api, subContent: Nội dung phụ đằng sau}
     * ]
     * @param {boolean} [statusHeader = true] là trạng thái hiển thị xem có index tự tăng ở đầu hay không. Nếu là false thì không hiển thị
     * @param {string} type phân biệt giữa lọc và lấy dữ liệu
     * @param {boolean} status phân biệt giữa việc khởi tạo layout và việc chỉ sử dụng các phương thức có trong layout true: Khởi tạo
     * @param {string, boolean} pagination thực id của phân trang. Nếu bạn truyền vào fase thì nó sẽ không thực hiện phân trang nữa
     * @param {array} subHtml là một mảng chứa các phần tử phụ muốn thêm vào cuối html. Thường là các trường tính tổng được thêm vào cuối bảng. Để sử dụng hãy truyền dữ liệu theo cách sau:
     * html: các thẻ td cần đưa xuống cuối bảng
     * column: các cột cần tính tổng, nếu bạn đưa vào toán tử và các trường cần tính thì nó sẽ thực hiện việc tính toán trước rồi mới tính tổng. Nếu bạn chỉ đưa vào 1 trường không thực hiện tính toán thì nó sẽ tự động tính tổng trường đó cho bạn
     * layout.subHtml = [
        {
            html: `<td class="phase align-middle white-space-nowrap text-center fw-bold" colspan="6">Tổng giá:</td>
                    <td class="phase align-middle white-space-nowrap text-start fw-bold" colspan="3">{total}</td>
                    `,
            column: "price_average * kl_quy_doi"
        }

    ];
     */
  constructor(api, template, total = true, status = true) {
    super();
    this.api = api;
    this.total = total;
    this.type = "get";
    this.form = "#list-data";
    this.template = template;
    this.statusHeader = true;
    this.pagination = "#paginations";
    this.request = new RequestServerHelpers(this.api);
    this.confirm = new ConfirmHelpers();
    this.subHtml = [];
    // lưu lại form khi đã được khởi tạo
    this.formCustom = "";
    this.colspan = 14;

    if (status)
      this.dataUI().then(() => {
        // xác thực xem có phân trang không
        if (this.pagination) this.initializeEvents();
      });
  }

  /**Hàm có tác dụng đổ dữ liệu ra giao diện */
  async dataUI() {
    let params = this.getParams();
    if (Object.keys(params).length > 0) {
      if (Array.isArray(this.api)) {
        this.api[0] = formatApiUrl(this.api[0], params);
      } else {
        this.api = this.removeAllParams(this.api);
        this.api = formatApiUrl(this.api, params);
      }
    } else {
      if (Array.isArray(this.api)) {
        this.api[0] = this.removeAllParams(this.api[0]);
      } else {
        this.api = this.removeAllParams(this.api);
      }
    }
    let data = await this.getUI();
    if (Array.isArray(this.api)) {
      if (data.length > 0) {
        // Lấy dữ liệu từ phần tử đầu tiên
        let combinedData = data[0].data;

        // Gộp dữ liệu của các object sau vào chung với combinedData
        for (let i = 1; i < data.length; i++) {
          combinedData = combinedData.concat(data[i]);
        }

        // Gán lại dữ liệu đã gộp vào phần tử đầu tiên
        data[0].data = combinedData;

        // Bây giờ, data[0] đã chứa tất cả dữ liệu gộp
        data = data[0];
      }
    }
    if (data.data.length <= 0) {
      this.insertHTMLInTable(data, 0);
    } else {
      this.insertHTMLInTable(data, 1);
    }
  }

  /**Hàm có tác dụng gọi api
   */
  getUI() {
    if (Array.isArray(this.api)) {
      // Nếu this.api là một mảng, gọi đồng thời các API trong mảng đó
      return axios
        .all(this.api.map((url) => axios.get(url)))
        .then(
          axios.spread((...responses) => {
            // Cập nhật nội dung cho DOM nếu this.total là một mảng
            let res = responses[0].data.data;
            if (Array.isArray(this.total)) {
              this.total.forEach((item) => {
                const element = document.getElementById(item.dom);
                if (element) {
                  const value = res[item.key];
                  element.innerText = `${value} ${item.subContent || ""
                    }`.trim();
                }
              });
            } else if (this.total === true) {
              // Trường hợp this.total là true, cập nhật tổng số sản phẩm
              const totalElement = document.getElementById("total");
              if (totalElement) {
                totalElement.innerText = `${res.total} sản phẩm`;
              }
            }

            // Trả về dữ liệu của tất cả các API
            return responses.map((res) => res.data.data);
          })
        )
        .catch((err) => {
          showErrorMD("Vui lòng gọi IT");
          console.error(err);
          return false; // Trả về false trong trường hợp có lỗi
        });
    } else if (!this.api) {
      console.error("Api không hợp lệ: " + this.api);
      return;
    }
    // Nếu this.api không phải là mảng
    return axios
      .get(this.api)
      .then((res) => {
        // Cập nhật nội dung cho DOM nếu this.total là một mảng
        if (Array.isArray(this.total)) {
          this.total.forEach((item) => {
            const element = document.getElementById(item.dom);
            if (element) {
              const value = res.data[item.key];
              element.innerText = `${value} ${item.subContent || ""}`.trim();
            }
          });
        } else if (this.total === true) {
          // Trường hợp this.total là true, cập nhật tổng số sản phẩm
          const totalElement = document.getElementById("total");
          if (totalElement) {
            totalElement.innerText = `${res.data.total} sản phẩm`;
          }
        }

        // Trả về dữ liệu
        return res.data;
      })
      .catch((err) => {
        showErrorMD("Vui lòng gọi IT");
        console.error(err);
        return false; // Trả về false trong trường hợp có lỗi
      });
  }

  /**Hàm có tác dụng đổ ra dữ liệu
   * @param data dữ liệu cần hiển thị
   * @param {boolean}  status phân biệt giữa hiển thị không có dữ liệu và có dữ liệu
   */
  insertHTMLInTable(data, stauts = 0) {
    const domForm = document.querySelector(this.form);
    if (!check(domForm, this.form)) return;

    if (domForm) {
      const tableElement = domForm.closest("table");
      const thead = tableElement.querySelector("thead");
      const thElements = thead.querySelectorAll("th");
      const numberOfThElements = thElements.length;
      this.colspan = numberOfThElements;
    }
    let html = "";
    if (stauts === 0) {
      html += `
                <tr class="loading-data">
                    <td class="text-center" colspan="${this.colspan}">
                        <span class="text-danger">Không có dữ liệu</span>
                    </td>
                </tr>
            `;
    } else {
      if (!data || data.from === "undefined") {
        console.error("api đang bị lỗi hoặc không sử dụng class phân trang");
        return;
      }
      let index = data.from;
      let totals = {};

      if (this.subHtml.length > 0) {
        // Khởi tạo tổng cho các cột trong subHtml
        this.subHtml.forEach((sub) => {
          totals[sub.column] = 0;
        });
      }

      data.data.forEach((item) => {
        let row = `<tr>`;
        if (this.statusHeader) {
          row += `<td class="phase align-middle white-space-nowrap text-center">${index++}</td>`;
        }
        row += this.template(item); // Truyền 'item' vào hàm htmlTemplates
        row += `</tr>`;
        html += row;

        if (this.subHtml.length > 0) {
          this.subHtml.forEach((sub) => {
            if (sub.column.includes("*")) {
              const [col1, col2] = sub.column
                .split("*")
                .map((col) => col.trim());
              if (item[col1] !== undefined && item[col2] !== undefined) {
                totals[sub.column] += Number(item[col1]) * Number(item[col2]);
              }
            } else if (item[sub.column] !== undefined) {
              totals[sub.column] += Number(item[sub.column]);
            }
          });
        }
      });

      // kiểm tra xem subHtml có rỗng hay không
      if (this.subHtml.length > 0) {
        this.subHtml.forEach((item) => {
          let footerRow = `<tr>`;
          footerRow += item.html.replace(
            "{total}",
            numberFormat(checkOutput(totals[item.column], 0))
          );
          footerRow += `</tr>`;
          html += footerRow;
        });
      }
    }
    // kiểm tra xem có thực hiện phân trang hay không
    if (this.pagination) {
      let paginations = document.querySelector(this.pagination);
      if (!check(paginations, this.pagination)) return;

      let htmlPaginations = `
            <div class="row align-items-center justify-content-between py-2 pe-0 fs-9">
                <div class="col-auto d-flex">
                    <p class="mb-0 d-none d-sm-block me-3 fw-semibold text-body">
                        ${data.from} đến ${data.to}
                        <span class="text-body-tertiary"> Trong </span> ${data.total
        }
                    </p>
                    <a class="btn-link" id = "btn-show-all" href="javascript:" title="Tất cả" ${data.all ? "hidden" : ""
        }> Tất cả
                        <span class="fas fa-angle-right ms-1"></span>
                    </a>
                    <a class="btn-link" id="btn-collapse" href="javascript:" title="Thu gọn" ${data.all ? "" : "hidden"
        }> Thu gọn<span class="fas fa-angle-left ms-1"></span>
                    </a>
                </div>
                    <nav class="col-auto d-flex">
                        <ul class="mb-0 pagination justify-content-end">
                            <li class="page-item ${data.currentPage <= 1 ? "disabled" : ""
        }">
                                <a class="page-link ${data.currentPage <= 1 ? "disabled" : ""
        }" id="btn-before" ${data.currentPage <= 1 ? 'disabled=""' : ""
        } href="javascript:" title="Trang trước" >
                                    <span class="fas fa-chevron-left"></span>
                                </a>
                            </li>`;
      let start = +data.currentPage - 3;
      let max = +data.currentPage + 3;

      if (start > 1) {
        htmlPaginations += `
                <li class="page-item disabled">
                    <a class="page-link" disabled="" title="" type="button" href="javascript:">...</a>`;
      }

      for (let index = start; index <= max; index++) {
        if (index > 0 && index <= +data.totalPages) {
          if (index == +data.currentPage) {
            htmlPaginations += `
                        <li class="page-item active">
                            <a class="page-link btn-paginations" title="Trang ${index}" href="javascript:" data-page="${index}" type="button">${index}</a>
                        </li>`;
          } else {
            htmlPaginations += `
                            <li class="page-item">
                                <a class="page-link btn-paginations" type="button" title="Trang ${index}" href="javascript:" data-page="${index}" >${index}</a>
                            </li>`;
          }
        }
      }
      if (max < +data.totalPages) {
        htmlPaginations += `
                <li class="page-item disabled">
                    <a class="page-link btn-paginations" disabled="" title="" type="button" href="javascript:">...</a>
                </li>`;
      }
      htmlPaginations += `
                    <li class="page-item ${data.currentPage >= data.totalPages ? "disabled" : ""
        }">
                        <a class= "page-link ${data.currentPage >= data.totalPages ? "disabled" : ""
        }" id="btn-after" href="javascript:" title="Trang sau">
                            <span class= "fas fa-chevron-right"></span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
            `;

      // Gán các sự kiện click cho các nút pagination
      paginations.innerHTML = htmlPaginations;
      // Hàm để khởi tạo sự kiện
      let btnShowAll = document.getElementById("btn-show-all");
      btnShowAll.addEventListener("click", (e) => {
        e.preventDefault();
        this.handlePaginationClick(btnShowAll, "", true);
      });

      let btnCollapse = document.getElementById("btn-collapse");
      btnCollapse.addEventListener("click", (e) => {
        e.preventDefault();
        this.handlePaginationClick(btnCollapse, "", false, true);
      });

      let btnBefore = document.getElementById("btn-before");
      btnBefore.addEventListener("click", (e) => {
        e.preventDefault();
        let pageOld = parseInt(this.getParams().page) || 1;
        this.handlePaginationClick(btnBefore, pageOld - 1);
      });
      let btnAfter = document.getElementById("btn-after");
      btnAfter.addEventListener("click", (e) => {
        e.preventDefault();
        let pageOld = parseInt(this.getParams().page) || 1;
        this.handlePaginationClick(btnAfter, pageOld + 1);
      });
    }
    domForm.innerHTML = html;
  }

  // Hàm chung để xử lý sự kiện click
  async handlePaginationClick(page, value, showAll = false, collapse = false) {
    if (showAll) {
      this.removeParam("page");
      this.addParamsToURL({ show_all: true });
    } else if (collapse) {
      this.removeParam("show_all");
      this.addParamsToURL({ page: 1 });
    } else {
      this.addParamsToURL({ page: value });
    }
    btnLoading(page, true, page.textContent);
    await this.dataUI();
    btnLoading(page, false, page.textContent);
  }

  // Hàm để khởi tạo sự kiện phân trang
  initializeEvents() {
    let pagination = document.querySelector(this.pagination);

    if (pagination) {
      pagination.addEventListener("click", (e) => {
        // Kiểm tra nếu phần tử click có class 'btn-paginations'
        if (e.target.classList.contains("btn-paginations")) {
          e.preventDefault();
          const clickedElement = e.target;
          const page = clickedElement.getAttribute("data-page");
          this.handlePaginationClick(clickedElement, page);
        }
      });
    } else {
      console.error("Không có id paginations trong dom");
      return;
    }
  }

  /**Hàm có tác dụng xuất file excel
   * @param dom nhận id class để lắng nghe sự kiện click
   * @param api api xuất file
   * @param name tên file file
   * @param buttonLoadding
   */
  exportExcel(dom = "", api, name) {
    const downloadFile = async (api, name) => {
      await axios
        .get(api, { responseType: "blob" })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${name}.xlsx`); // Tên file muốn tải xuống
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((err) => {
          console.log(err);
          showErrorMD(`Không đủ dữ liệu để xuất file ${name}.xlsx`);
        });
    };

    if (dom !== "") {
      let exportExcel = document.querySelector(dom);
      if (!check(exportExcel, dom)) return;
      let textContent = exportExcel.innerHTML.trim();

      exportExcel.addEventListener("click", async (e) => {
        let params = this.getParams();
        if (Object.keys(params).length > 0 && params.page) {
          api = formatApiUrl(api, params);
        }
        btnLoading(exportExcel, true);
        await downloadFile(api, name);
        btnLoading(exportExcel, false, textContent);
      });
    } else {
      downloadFile(api, name);
    }
  }

  /**Hàm có tác dụng lọc dữ liệu
   * @param {Đối tượng} formCustom nhận vào khi được khởi tạo
   */
  filterForm() {
    let dom = {};
    if (this.formCustom === "") {
      console.error(
        "Vui lòng khởi tạo form cho form filter bằng class FormHelper và thực hiện ghi đè thuộc tính formCustom ở layout với form mới đã được khởi tạo!"
      );
      return;
    }
    const submitButton = this.formCustom.form.querySelector('button[type="submit"]');
    if (!submitButton) {
      console.error("Trong form filter không có button nào chứa type=submit");
      return;
    }
    const submitButtonTextContent = submitButton.innerHTML;

    // kiểm tra xem url có param đó không
    let data = this.getParams();
    if (Object.keys(data).length > 0) {
      // Lấy tất cả các phần tử trong form
      const elements = this.formCustom.form.elements;

      for (let item of elements) {
        const name = item.getAttribute("name");
        // tìm kiếm và lấy dữ liệu của data dựa vào name thẻ
        if (name && data.hasOwnProperty(name)) {
          let value = data[name];

          // Kiểm tra nếu phần tử là Choices instance và cập nhật Choices
          if (item.hasAttribute("data-choice")) {
            let id = item.getAttribute("id");
            let choiceInstance = this.formCustom.choice[`#${id}`];
            choiceInstance.setChoiceByValue(String(value));
          } else {
            item.value = value;
          }
        }
      }
    }
    if (!this.formCustom.hasEventListener) {
      this.formCustom.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btnLoading(submitButton, true);

        let selects = this.formCustom.form.querySelectorAll("select");
        let inputs = this.formCustom.form.querySelectorAll("input");

        // Thu thập tất cả các thẻ select, input, textarea vào đối tượng dom
        let collectElements = (elements) => {
          elements.forEach((item) => {
            let name = item.getAttribute("name");
            if (name && item.value) {
              dom[name] = item.value.trim();
            }
          });
        };

        collectElements(selects);
        collectElements(inputs);
        // Sử dụng hàm removeParamsExcept và chỉ định các tham số muốn giữ lại
        let keysToKeep = ["page", "show_all"];
        this.removeParamsExcept(keysToKeep);
        // đưa các param lên url
        this.addParamsToURL(dom);
        this.type = "search";
        // gọi api
        await this.dataUI();
        btnLoading(submitButton, false, submitButtonTextContent);
        dom = {};
      });
      this.formCustom.hasEventListener = true; // Đánh dấu là sự kiện đã được đăng ký
    }
  }

  /**Hàm có tác dụng xóa lọc dữ liệu
   * @param deleteFiter nhận vào id class nút filter
   * @param formCustom nhận vào form khi dã được khởi tạo tại class formCustom
   */
  deleteFilterForm(deleteFiter = "#deleteFilter") {
    const buttonFilter = document.querySelector(deleteFiter);
    if (this.formCustom === "") {
      console.error(
        "Vui lòng khởi tạo form cho form filter bằng class FormHelper và thực hiện ghi đè thuộc tính formCustom ở layout với form mới đã được khởi tạo!"
      );
      return;
    }
    if (!check(buttonFilter, deleteFiter)) return;

    buttonFilter.addEventListener("click", async () => {
      this.formCustom.reset();
      // Lấy toàn bộ HTML của phần tử và các thẻ con dưới dạng chuỗi
      let textContent = buttonFilter.innerHTML.trim();
      btnLoading(buttonFilter, true);
      // Sử dụng hàm removeParamsExcept và chỉ định các tham số muốn giữ lại
      let keysToKeep = ["page", "show_all"];
      this.removeParamsExcept(keysToKeep);
      await this.dataUI();
      btnLoading(buttonFilter, false, textContent);
    });
  }

  /**Hàm có tác dụng thực hiện việc gọi api và xóa
     * @param {Object} params là một object đi kèm với api
     * @param {Object} config là một object giúp bạn hiển thị confirm cho người dùng biết
     * @param {string} method nhận vào một phương thức để gửi đi dữ liệu
     * Ví dụ:
     *  config = {
            text: 'Nội dung cần hiển thị: Bạn có muốn xóa không',
            btnText: 'Chữ trong button: Xóa',
            btnBg: 'Màu nút button: red',
            title: "title khi hover vào nút button: Xóa",
        }
     *
     */

  confirmAndRequest(params, config = {}, method = "delete") {
    this.request.params = params;
    // Hiển thị confirm
    this.confirm.show();

    // Cấu hình confirm nếu có truyền vào
    if (Object.keys(config).length > 0) {
      this.confirm.config = {
        ...this.confirm.config, // Giữ lại các config mặc định
        ...config, // Ghi đè config bằng cái mới
      };
    }

    // Hiển thị confirm và thực hiện xóa nếu người dùng đồng ý
    this.confirm.config.success = async () => {
      return await this.request.requestData(method);
    };
  }
}

export { RequestServerHelpers, codeAutoGenerationHelpers, generateCode, FormHelpers, URLHelpers, ConfirmHelpers, LayoutHelpers }