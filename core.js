import { formatApiUrl, convertDateFormatHelpers, formatAPI, check, formatDataResponse } from "./coreFunctions.js";
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

/**Class làm việc  các sự kiện change*/
class EventHelpers {
  /**
   * 
   * @param {Object} scope phạm vi mà các dom được phép lắng nghe. Giả sử bạn chỉ muốn lắng nghe sự kiện của 1 form. Thì bạn truyền dom của form đó khi khởi tạo class như vậy các sự kiện sẽ chỉ được lắng nghe trong form đó.
   */
  constructor(scope) {
    // Kiểm tra xem scope có phải là một phần tử DOM hợp lệ không, nếu không mặc định là document
    this.scope = (scope instanceof HTMLElement || scope instanceof Document) ? scope : document;
  }
  // Phương thức chung để thêm sự kiện
  addEvent(dom, eventType, callback) {
    const domElement = this.scope.querySelector(dom);
    // Kiểm tra xem dom có tồn tại và có phải là một phần tử DOM hợp lệ không
    if (!check(domElement, dom)) return;
    domElement.addEventListener(eventType, (e) => {
      callback(e);
    });
  }

  // lắng nghe sự kiện input
  input(dom, callback) {
    this.addEvent(dom, "input", callback);
  }
  // lắng nghe sự kiện submit
  submit(form, callback) {
    this.addEvent(form, "submit", (e) => {
      e.preventDefault();
      callback(e);
    });
  }
  // lắng nghe sự kiện click
  click(dom, callback) {
    this.addEvent(dom, "click", callback);
  }
  // lắng nghe sự kiện change
  change(dom, callback) {
    this.addEvent(dom, "change", callback);
  }
  // lắng nghe sự kiện addItem
  addItem(dom, callback) {
    this.addEvent(dom, "addItem", callback);
  }
  // lắng nghe sự kiện search
  search(dom, callback) {
    this.addEvent(dom, "search", callback);
  }
}

/**Class làm việc với modal */
class ModalHelpers extends RequestServerHelpers {
  /**
   * @param {Object} form đã được khởi tạo bằng class FormHelpers
   * @param {string} modalSelector nhận vào 1 id, class modal
   * @param {string} api được sử dụng khi khởi tạo modal edit
   */
  constructor(form, modalSelector, api = "") {
    super("");
    this.form = form;
    this.api = api;
    this.modalSelector = modalSelector;
    this.priceFormat = [];
    this.dateFormat = [];
    this.modal = null;
    this.loading = null;
    this.newModal = null;

  }

  /** Khởi tạo modal và xử lý sự kiện mở modal 
   * @param {string} showSelector nhận vào 1 id, class để lắng nghe việc mở modal. Nếu để trống nó sẽ tự động mở modal sau khi gọi hàm
   * @param {Array} dataDefault dữ liệu mặc định được đổ vào form khi mở modal
   * Ví dụ:
   * dataDefault = [
   * { dom: "Id hoặc class đổ ra dữ liệu mặc định", value: "Dữ liệu mặc định"},
   * ]
  */
  startModal(showSelector = "", dataDefault = []) {
    const openModal = () => {
      this.modal = document.querySelector(this.modalSelector);
      if (!check(this.modal, this.modalSelector)) return;

      this.initializeModal();
      this.showModal();
      this.setLoading();

      // Đổ dữ liệu mặc định vào form nếu có
      this.modal.addEventListener("shown.bs.modal", () => {
        this.hideLoading();
        if (dataDefault.length > 0) this.fillFormWithDefaults(dataDefault);
      });
      // Khởi tạo sự kiện đóng modal
      this.resetModal();
    };

    // Nếu có showSelector, gắn sự kiện click vào phần tử đó để mở modal
    if (showSelector) {
      const element = document.querySelector(showSelector);
      if (!check(element, showSelector)) return;
      element.addEventListener("click", openModal);
    } else {
      openModal();
    }
  }

  /** Khởi tạo modal edit và đổ dữ liệu từ API 
   * @param {Object} params nhận vào object param
  */
  async startModalEdit(params = {}) {
    try {
      this.modal = document.querySelector(this.modalSelector);
      if (!check(this.modal, this.modalSelector)) return;

      this.params = params;
      this.initializeModal();
      this.showModal();
      this.setLoading();

      // Lấy dữ liệu từ API
      const response = await this.getData(this.api);
      if (response.status !== 200) {
        showErrorMD("Đã xảy ra lỗi khi lấy dữ liệu. Vui lòng thử lại.");
        return;
      }

      let data = response.data?.data?.length ? response.data.data[0] : response.data[0];

      this.modal.addEventListener("shown.bs.modal", () => {
        this.hideLoading();
        this.fillFormWithData(data); // Đổ dữ liệu vào form
      });
      // Khởi tạo sự kiện đóng modal
      this.resetModal();
    } catch (error) {
      console.error("Error during startModalEdit:", error);
      showErrorMD("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  }

  /** Khởi tạo modal */
  initializeModal() {
    this.newModal = new bootstrap.Modal(this.modal, {});
  }

  /** Hiển thị modal */
  showModal() {
    if (this.newModal) {
      this.newModal.show();
    } else {
      console.error("Modal instance is not initialized.");
    }
  }

  /** Ẩn modal */
  hideModal() {
    if (this.newModal) {
      this.newModal.hide();
    } else {
      console.error("Modal instance is not initialized.");
    }
    this.reset();
  }

  /** Thiết lập loading */
  setLoading() {
    if (this.modal) {
      this.loading = document.createElement("div");
      this.loading.className = "spinner-border text-info spinner-border-sm";
      this.loading.role = "status";
      this.loading.innerHTML = '<span class="visually-hidden">Loading...</span>';
      this.loading.style.position = "absolute";
      this.loading.style.top = "15%";
      this.loading.style.left = "50%";
      this.modal.querySelector(".modal-body").appendChild(this.loading);
      this.loading.style.display = "block"; // Hiển thị loading
    }
  }

  /** Ẩn loading */
  hideLoading() {
    if (this.loading) {
      this.loading.style.display = "none";
    }
  }

  /** Đổ dữ liệu mặc định vào form */
  async fillFormWithDefaults(dataDefault) {
    dataDefault.forEach(async (item) => {
      const element = this.form.form.querySelector(item.dom);
      if (element) {
        let value = typeof item.value === "function" ? await item.value() : item.value;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
          element.value = value;
        } else {
          element.textContent = value;
        }
      } else {
        console.error("Không có phần tử này: " + item.dom + " trong DOM");
      }
    });
  }

  /** Đổ dữ liệu từ API vào form */
  fillFormWithData(data) {
    const elements = this.form.elements;
    for (let item of elements) {
      const name = item.getAttribute("name");
      if (name && data.hasOwnProperty(name)) {
        let value = data[name];
        if (item.hasAttribute("data-choice")) {
          let id = item.getAttribute("id");
          let choiceInstance = this.form.choice[`#${id}`];
          if (choiceInstance) {
            choiceInstance.setChoiceByValue(String(value));
          } else {
            console.error(`Choice instance for #${id} is not initialized.`);
          }
        } else {
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
  }

  /** Reset modal khi đóng */
  resetModal() {
    if (this.modal) {
      this.modal.addEventListener("hidden.bs.modal", () => {
        this.reset();
      });
    }
  }

  /** Reset form và các phần tử modal */
  reset() {
    if (this.form) {
      this.form.reset();
    }
    if (this.loading) this.loading.style.display = "none";
  }
}

/**Class có tác dụng thực hiện validate các trường */
class ValidateHelpers {
  /**
 * @param {object} form  nhận vào form cần validate
 * @param {object} validations  nhận vào các quy tắc cần validate
   */
  constructor(form, validations) {
    this.form = form;
    this.validations = validations;
  }

  /**
   * Hàm validateForm form thông thường
   * @param {Boolean} textSelect nếu là false thì trả về mảng dữ liệu, ngược lại trả về nội dung thẻ select đã được chọn
   * @returns {Object|Boolean} Trả về object chứa dữ liệu nếu thành công, false nếu có lỗi
   */
  validateForm(textSelect = false) {
    const dom = this.collectFormElements(textSelect);
    const data = {};

    // Thực hiện validateForm theo bảng thiết kế
    if (!this.runValidation(dom)) return false;

    // Thu thập dữ liệu từ các trường
    for (let key in dom) {
      let item = dom[key];
      data[key] = (item instanceof HTMLElement) ? item.value.trim() : item.trim();
    }

    return data;
  }

  /**
   * Hàm validate các hàng trong table
   * @param {String} tbodySelector selector cho tbody
   * @returns {Array|Boolean} Trả về mảng dữ liệu các hàng nếu thành công, false nếu có lỗi
   */
  validateRow(tbodySelector) {
    const tbodyElement = document.querySelector(tbodySelector);
    if (!check(tbodyElement, tbodyElement)) return;

    const rows = tbodyElement.querySelectorAll("tr");
    const data = [];

    for (let row of rows) {
      const dom = this.collectRowElements(row);

      // Thực hiện validate cho mỗi hàng
      if (!this.runValidation(dom)) return false;

      // Thu thập dữ liệu từ các hàng
      const rowData = {};
      for (let key in dom) {
        rowData[key] = dom[key].value;
      }
      data.push(rowData);
    }

    return data;
  }

  /**
   * Thu thập các thẻ input, select, textarea trong form
   * @param {Boolean} textSelect 
   * @returns {Object} object chứa các thẻ DOM đã thu thập
   */
  collectFormElements(textSelect) {
    const elements = [...this.form.querySelectorAll("select, input, textarea")];
    const dom = {};

    elements.forEach((item) => {
      let name = item.getAttribute("name");
      if (name) {
        dom[name] = item;
        if (textSelect && item.tagName.toLowerCase() === "select") {
          dom[`text_${name}`] = item.textContent;
        }
      }
    });

    return dom;
  }

  /**
   * Thu thập các thẻ input, select, textarea trong một hàng của table
   * @param {HTMLElement} row đối tượng tr đại diện hàng <tr>
   * @returns {Object} object chứa các thẻ DOM đã thu thập từ hàng
   */
  collectRowElements(row) {
    const elements = [...row.querySelectorAll("select, input, textarea")];
    const rowData = {};

    elements.forEach((item) => {
      let name = item.getAttribute("name");
      if (name) {
        rowData[name] = item;
      }
    });

    return rowData;
  }

  /**
   * Chạy quá trình validate theo bảng thiết kế
   * @param {Object} dom object chứa các phần tử cần validate
   * @returns {Boolean} Trả về true nếu thành công, false nếu có lỗi
   */
  runValidation(dom) {
    for (let { name, defaultName, condition, message } of this.validations) {
      if (Array.isArray(name)) {
        let fieldValues = name.map((item) => dom[item]?.value);
        if (!this.checkMultipleFields(fieldValues, name, condition, dom, message, defaultName)) return false;
      } else {
        let field = dom[name];
        if (field && !this.checkSingleField(field, condition, message)) return false;
      }
    }
    return true;
  }

  /**
   * Kiểm tra điều kiện với nhiều trường hợp
   * @param {Array} fieldValues Mảng giá trị các trường
   * @param {Array} names Mảng tên các trường
   * @param {Function} condition Hàm điều kiện
   * @param {Object} dom object chứa các phần tử
   * @param {String} message Thông báo lỗi
   * @param {String} defaultName Tên mặc định của trường
   * @returns {Boolean} Trả về true nếu hợp lệ, false nếu không
   */
  checkMultipleFields(fieldValues, names, condition, dom, message, defaultName) {
    if (fieldValues.every((value) => value !== undefined)) {
      if (!condition(...fieldValues)) {
        names.forEach((name) => {
          let field = dom[defaultName] || dom[name];
          if (field) changeValidateMessage(field, true, message, ["p-2", "small"]);
        });
        return false;
      }
      names.forEach((name) => {
        let field = dom[defaultName] || dom[name];
        if (field) changeValidateMessage(field, false, "", []);
      });
    }
    return true;
  }

  /**
   * Kiểm tra điều kiện với một trường duy nhất
   * @param {HTMLElement} field Trường cần kiểm tra
   * @param {Function} condition Hàm điều kiện
   * @param {String} message Thông báo lỗi
   * @returns {Boolean} Trả về true nếu hợp lệ, false nếu không
   */
  checkSingleField(field, condition, message) {
    if (!condition(field.value)) {
      changeValidateMessage(field, true, message, ["p-2", "small"]);
      return false;
    }
    if (field.getAttribute("min-custom") && parseFloat(field.value) < parseFloat(field.getAttribute("min-custom"))) {
      changeValidateMessage(field, true, `Số lượng phải lớn hơn hoặc bằng ${field.getAttribute("min-custom")}`, ["p-2", "small"]);
      return false;
    }
    if (field.getAttribute("max-custom") && parseFloat(field.value) > parseFloat(field.getAttribute("max-custom"))) {
      changeValidateMessage(field, true, `Số lượng phải nhỏ hơn hoặc bằng ${field.getAttribute("max-custom")}`, ["p-2", "small"]);
      return false;
    }
    changeValidateMessage(field, false, "", []);
    return true;
  }
}

/**Class có tác dụng làm việc với thẻ select */
class SelectHelpers {

  constructor(form) {
    this.form = form;
    this.params = {};
    this.value = "id";
    this.customProperties = [];

    this.event = new EventHelpers(this.form);
    this.request = new RequestServerHelpers();
  }

    // Hàm xử lý chung cho dữ liệu trả về và thiết lập cho Choices
    processApiData(res, label, labelDefault) {
      if (res.status !== 200) {
        showErrorMD("Không có dữ liệu bạn cần tìm");
        return [{ value: "", label: labelDefault }];
      }
      let data = formatDataResponse(res);
      return data.map(item => {
        const labelValue = Array.isArray(label) 
          ? label.map(lbl => item[lbl]).join("-")
          : item[label];
        const customProps = this.getCustomProperties(item);
        return {
          label: labelValue,
          value: item[this.value],
          customProperties: customProps,
        };
      });
    }
  
    // Lấy customProperties từ item
    getCustomProperties(item) {
      let customProps = {};
      if (Array.isArray(this.customProperties) && this.customProperties.length > 0) {
        this.customProperties.forEach(prop => {
          if (item.hasOwnProperty(prop)) {
            customProps[prop] = item[prop];
          }
        });
      }
      return customProps;
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
  eventListenerChange(selectChange, selectReceive, api, key, label, labelDefault) {
    let choiceSelectReceive = this.form.choice[selectReceive];
    if (!check(choiceSelectReceive, selectReceive, "choice")) return;

    this.event.change(selectChange, async (e) => {
      let value = e.target.value;
      choiceSelectReceive.clearStore();
      choiceSelectReceive._handleLoadingState(true);
      this.params = { [key]: value, ...this.params };

      let res = await this.request.getData(api);
      let dataChoice = this.processApiData(res, label, labelDefault);
      dataChoice.unshift({ value: "", label: labelDefault });

      choiceSelectReceive.setChoices(dataChoice, "value", "label", true);
      choiceSelectReceive._handleLoadingState(false);
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
    const domSelectChange = this.form.querySelector(selectChange);
    if (!check(domSelectChange, selectChange)) return;
    // Kiểm tra xem receive là mảng hay chuỗi và thiết lập domReceive
    const isReceiveArray = Array.isArray(receive);
    const domReceive = isReceiveArray ? null : this.form.querySelector(receive);
    if (!isReceiveArray && !domReceive) {
      console.error("Không tìm thấy id hoặc class này: " + receive);
      return;
    }
    // Hàm xử lý cập nhật dữ liệu vào domReceive hoặc danh sách domReceive
    const updateReceive = (data) => {
      if (isReceiveArray) {
        receive.forEach((item) => {
          const dataCustomProperties = data[item.value];
          // chỉ cho phép tìm các phần tử ở trong form
          let dom = this.form.querySelector(item.dom);
          this.updateDomReceive(dom, dataCustomProperties);
        });
      } else if (api) {
        this.updateDomReceive(domReceive, data[value]);
      } else {
        this.updateDomReceive(domReceive, data);
      }
    };
    // Thêm sự kiện change cho selectChange

    this.event.addItem(selectChange, async (e) => {
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
            const data = formatDataResponse(res);
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
    })
  }

  /**Hàm có tác dụng lắng nghe sự kiện change của 1 thẻ select và xóa dữ liệu của 1 thẻ khác 
   * @param {string} selectChange ID, Class của thẻ được chọn
   * @param {string} receive name của thẻ được nhận. Nếu bạn có nhiều nơi cần nhận dữ liệu đồng nghĩa với việc bạn đã lưu dữ liệu vào customProperties thì hãy truyền receive theo cách sau:
   * const received = [ "ratio", "price",];
   */
  eventChangeClearField(selectChange, receive) {

    // Kiểm tra xem receive là mảng hay chuỗi và thiết lập domReceive
    const isReceiveArray = Array.isArray(receive);

    const domReceive = isReceiveArray ? null : this.form.querySelector(`[name="${receive}"]`);

    if (!isReceiveArray && !domReceive) {
      console.error("Không tìm thấy id hoặc class này: " + receive);
      return;
    }

    // Hàm xử lý cập nhật dữ liệu vào domReceive hoặc danh sách domReceive
    const clearReceive = () => {
      if (isReceiveArray) {
        receive.forEach((item) => {
          // Chỉ cho phép tìm các phần tử ở trong form
          let dom = this.form.querySelector(`[name="${item}"]`);
          if (!dom) return; // Nếu không tìm thấy phần tử, bỏ qua
          if (dom.getAttribute("data-choice")) {
            let id = dom.getAttribute("id");
            // Tìm đối tượng Choices
            let choiceInstance = this.form.choice[`#${id}`];
            if (choiceInstance) choiceInstance.setChoiceByValue(""); // Xóa các lựa chọn hiện tại
          } else {
            dom.value = "";
          }
        });
      } else {
        if (domReceive) {
          if (domReceive.getAttribute("data-choice")) {
            let id = domReceive.getAttribute("id");
            // Tìm đối tượng Choices
            let choiceInstance = this.form.choice[`#${id}`];
            if (choiceInstance) choiceInstance.setChoiceByValue(""); // Xóa các lựa chọn hiện tại
          } else {
            domReceive.value = ""; // Xóa giá trị của input và textarea
          }
        }
      }
    };

    // Thêm sự kiện change cho domSelectChange
    this.event.change(selectChange, (e) => {
      clearReceive(); // Gọi hàm clearReceive khi có sự kiện change
    });
  }


  // Hàm cập nhật domReceive tùy theo loại thẻ hàm dùng nội bộ
  updateDomReceive(domReceive, content) {
    if (domReceive.tagName === "INPUT" || domReceive.tagName === "TEXTAREA") {
      domReceive.value = "";
      domReceive.value = checkOutput(content);
    } else {
      domReceive.innerHTML = "";
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
  async selectMore(select, api, key, label, labelDefault, params = {}) {
    let myTimeOut = null;
    let selectDom = document.querySelector(select);
    let choiceSelect = this.form.choice[select];
    if (!check(selectDom, select)) return;
    if (!check(choiceSelect, select, "choice")) return;
    // Lắng nghe sự kiện tìm kiếm
    this.event.search(select, async (e) => {
      let query = e.detail.value.trim();
      clearTimeout(myTimeOut);
      myTimeOut = setTimeout(async () => {
        choiceSelect.setChoiceByValue("");
        choiceSelect._handleLoadingState();
        try {
          this.params = { [key]: query, ...params };
          let res = await this.request.getData(api);
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
            if (Array.isArray(this.customProperties) && this.customProperties.length > 0) {
              this.customProperties.forEach((prop) => {
                if (item.hasOwnProperty(prop)) customProps[prop] = item[prop];
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
    })
  }

  /**Đổ dữ liệu vào thẻ select choices thông qua api
   * @param {string} select ID của thẻ được chọn
   * @param {string} api api nhận lấy ra dữ liệu
   * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option
   * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
   * @param {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties.
   * @param {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
   */
  async selectData(select, api, label, labelDefault) {
    // Tìm đối tượng Choices cho selectChange và select
    let choiceSelect = this.form.choice[select];
    // Kiểm tra nếu đối tượng Choices tồn tại
    if (choiceSelect) {
      choiceSelect._handleLoadingState(true);
      let res = await this.request.getData(api);
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
          if (Array.isArray(this.customProperties) && this.customProperties.length > 0) {
            this.customProperties.forEach((prop) => {
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
     * @param {string} modal id modal cần khởi tạo
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
  constructor(formSelector, startHandleFormSubmit = false, validations, api, method, layout, modal, debug = false) {
    super(api); // Gọi hàm khởi tạo của lớp cha
    this.form = document.querySelector(formSelector);
    if (!check(this.form, formSelector)) return;

    this.api = api;
    this.validations = validations;
    this.layout = layout;


    this.value = "id";
    this.subdata = {};
    this.param = {};
    // lưu trữ khi khởi tạo choice
    this.choice = {};

    this.notRest = [];
    this.priceFormat = [];
    this.dateFormat = [];

    this.exportExcel = false;
    this.responseHandler = false;
    this.resetStatus = true;
    this.modalStatus = true;
    this.table = true;

    // tự động khởi tạo choices khi khởi tạo FormHelpers
    this.startChoice();
    // tự động khởi tạo form submit
    if (startHandleFormSubmit) this.handleFormSubmit(method, this.layout, debug);

    // khởi tạo class event 
    this.eventHelpers = new EventHelpers(this.form);
    // khởi tạo class validate để validate form khi submit
    this.validate = new ValidateHelpers(this.form, this.validations);
    // khởi tạo class modal
    this.modal = new ModalHelpers(this, modal, this.api);
    // khởi tạo class SelectHelpers
    this.select = new SelectHelpers(this.form);

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
            const element = this.form.querySelector(item.dom);
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
      let data = this.table === true ? this.validate.validateForm() : this.validate.validateRow(this.table);
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
        if (this.resetStatus === true) this.reset();
        if (this.exportExcel) {
          let api = `${this.exportExcel.api}${response.data}`;
          this.layout.exportExcel("", api, this.exportExcel.name);
        }
      }
    });
  }

}

/**class thao tác với form chứa tabel. Tức là khi bạn ấn submit form mà chưa muốn gọi api giửi đi mà muốn hiển thị lại giao diện cho ngừơi dùng xem*/
class FormTableHelpers extends FormHelpers {
  /**
   * @param {string} formSelector Nhận vào id class của 1 form cần khởi tạo
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
   * @param {Đối tượng} layout  nhận vào đối tượng layout được khởi tạo
   * @param {callback} template nội dung bạn sẽ hiển thị khi ấn submit từ form xuống bảng. Mặc định là có nút xóa
   * @param {string} modal id modal cần khởi tạo
   * @param {boolean} [debug=false]  được sử dụng để test api nếu là true thì sẽ dừng chương trình sau khi gọi api và console.log() response
   * method  nhận vào method thực hiện gửi dữ liệu mặc định là post
   * value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id
   * subdata nhận vào object các trường cần bổ sung để gửi data. Dùng cho trường hợp trong form thiếu trường dữ liệu
   * notRest Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
   * priceFormat nhận vào mảng tên các thẻ cần format theo dạng tiền tệ
   * dateFormat nhận vào mảng tên các thẻ cần format theo dạng thời gian
   * exportExcel phân xem khi submit có xuất file excel. Nếu có xuất thì ghi đè với cú pháp sau:
   * exportExcel = {api: "API xuất file", name: "Tên file xuất"}
   * Lưu ý: Mặc định sẽ lấy phần data trả về làm param và gọi api để tải file. Phải khởi tạo layout và ghi đè layout trước khi ghi đè dữ liệu
   * responseHandler là một object. Được sử dụng sau khi ấn submit và sẽ chạy hàm bên trong object đó
   * Cú pháp: this.responseHandler = {code: "mã trả về. Điều kiện để chạy function", function: () => {}}
   * 
   * dataTotal nơi lưu trữ dữ liệu sau khi submit từ form
   * tbody id của thẻ tbody nơi đổ ra dữ liệu
   * btnSendData button bạn sẽ gửi dữ liệu
   * method được gửi đi
   * [formInTable=false] xác định xem bảng đó có chứa các ô input không.
   * [resetTable=true] xác định xem có rest bảng không 
   * [resetForm=true] xác định xem có rest form không
   * [statusModal=true] xác định xem có rest modal không
   */
  constructor(formSelector, validations, api, layout, template, modal, debug = false) {
    super(formSelector, false, validations, api, "", layout, debug);
    this.debug = debug;
    this.formSelector = formSelector;

    this.EventHelpers = new EventHelpers();
    this.validate = new ValidateHelpers(this.form, validations);
    this.modal = new ModalHelpers(this, modal, '');

    this.template = template;

    this.dataTotal = [];

    this.tbody = "#table-body";
    this.domTbody = document.querySelector(this.tbody);
    if (!check(this.domTbody, this.tbody)) return;

    this.btnSendData = "#btn-send-data";
    this.method = "post";

    this.formInTable = false;
    this.resetTable = true;
    this.resetForm = true;
    this.statusModal = true;
    this.index = 0;

    this.initEventListeners();
  }

  // Tách việc đăng ký các sự kiện ra thành một hàm riêng
  initEventListeners() {
    this.handleFormSubmit();
    this.handleSendData();
  }

  // Hàm xử lý việc submit form và thêm dữ liệu vào bảng
  handleFormSubmit() {
    this.EventHelpers.submit(this.formSelector, (e) => {
      let data = this.validate.validateForm(true);
      if (data !== false) {
        this.resetFormInputs();
        this.renderRowInTable(data);
        this.dataTotal.push(data);
      }
    });
  }

  // Hàm render một hàng trong bảng
  renderRowInTable(data) {
    const header = `<tr index="${this.index}">`;
    const main = this.template(data);
    const footer = `
    <td class="align-middle white-space-nowrap text-center" scope="col" data-sort="role" style="max-width:160px">
        <button type="button" onclick="this.deleteDataFromTable(${this.index})" class="btn btn-sm btn-phoenix-secondary text-danger fs-8">
            <span class=" uil-trash-alt"></span>
        </button>  
    </td>
  </tr>`;

    const html = header + main + footer;
    this.domTbody.insertAdjacentHTML('beforeend', html);
    this.index += 1;
  }

  // Hàm xóa một hàng khỏi bảng dựa trên chỉ số (index)
  deleteDataFromTable(indexToRemove) {
    if (indexToRemove >= 0 && indexToRemove < this.dataTotal.length) {
      this.dataTotal.splice(indexToRemove, 1);
      const rows = Array.from(this.domTbody.getElementsByTagName('tr'));

      rows.forEach(row => {
        const index = row.getAttribute('index');
        if (index === indexToRemove.toString()) {
          row.remove();
          showMessageMD("Xóa thành công");
        }
      });
    } else {
      showErrorMD("Không tìm thấy dữ liệu bạn cần xóa");
    }
  }

  // Hàm gửi dữ liệu khi nhấn nút submit
  handleSendData() {
    const btnSendData = document.querySelector(this.btnSendData);
    if (!check(btnSendData, this.btnSendData)) return;

    // thực hiện hiệu ứng loadding khi ấn gửi
    const btnSendDataTextContent = btnSendData.textContent;
    btnLoading(btnSendData, true)

    this.EventHelpers.click(this.btnSendData, async () => {
      this.dataTotal = this.formInTable ? this.validate.validateRow(this.formInTable) : this.dataTotal;

      if (this.dataTotal !== false && this.dataTotal.length > 0) {
        if (Object.keys(this.subdata).length > 0) {
          this.dataTotal = { ...this.dataTotal, ...this.subdata };
        }

        // Format dữ liệu trước khi gửi đi
        this.formatDataBeforeSend();

        // Thực hiện gửi dữ liệu
        let response = await this.sendRequest(this.dataTotal, this.debug, this.method);
        // nếu có yêu cầu sau gì đó sau khi gọi api, kiểm tra status có trùng với yêu cầu không, thực hiện gọi hàm đó
        if (this.responseHandler) if (response !== false && this.responseHandler.status === response.data.status) this.responseHandler.function();
        // xác định việc gửi dữ liệu thành công
        if (response !== false && response.status >= 200 && response.status < 400) {
          if (this.resetForm) this.resetFormInputs();
          if (this.resetTable) this.clearTable();
          if (this.statusModal) this.modal.hideModal();
          this.dataTotal = [];
          this.index = 0;
          this.exportDataIfNecessary(response.data);
        }
      }
    });
    btnLoading(btnSendData, false, btnSendDataTextContent);
  }

  // Hàm định dạng lại dữ liệu trước khi gửi đi (giá và ngày)
  formatDataBeforeSend() {
    this.priceFormat.forEach(name => {
      if (this.dataTotal.hasOwnProperty(name)) {
        this.dataTotal[name] = removeCommasHelpers(this.dataTotal[name]);
      }
    });

    this.dateFormat.forEach(name => {
      if (this.dataTotal.hasOwnProperty(name)) {
        this.dataTotal[name] = convertDateFormatHelpers(this.dataTotal[name]);
      }
    });
  }

  // Hàm để xuất dữ liệu ra Excel (nếu cần)
  exportDataIfNecessary(responseData) {
    if (this.exportExcel && responseData) {
      const api = `${this.exportExcel.api}${responseData}`;
      this.layout.exportExcel("", api, this.exportExcel.name);
    }
  }

  // Hàm reset lại form inputs
  resetFormInputs() {
    this.reset();
  }

  // Hàm xóa toàn bộ dữ liệu trong bảng
  clearTable() {
    this.domTbody.innerHTML = "";
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

export { RequestServerHelpers, codeAutoGenerationHelpers, generateCode, FormHelpers, URLHelpers, ConfirmHelpers, LayoutHelpers, EventHelpers, FormTableHelpers }