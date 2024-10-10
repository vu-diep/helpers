import { EventHelpers, RequestServerHelpers, FileHelpers, URLHelpers } from "./core.js";
import { formatDataResponse, check, clearAllClassValidateHelpers, convertDateFormatHelpers, numberFormatHelpers } from "./coreFunctions.js";
import { removeCommasHelpers } from "./common.js";
// xác định message trả về
const messageError = "error";
const messageSussces = "success";

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
        // lấy ra dữ liệu choices đã được khởi tạo
        this.dataChoice = this.form.choice.choice;
        this.priceFormat = [];
        this.dateFormat = [];
        this.modal = null;
        this.loading = null;
        this.newModal = null;
    }

    /** Khởi tạo modal và xử lý sự kiện mở modal 
     * @param {string} bntStartModal nhận vào 1 id, class để lắng nghe việc mở modal. Nếu để trống nó sẽ tự động mở modal sau khi gọi hàm
     * @param {Array} dataDefault dữ liệu mặc định được đổ vào form khi mở modal
     * Ví dụ:
     * dataDefault = [
     * { dom: "Id hoặc class đổ ra dữ liệu mặc định", value: "Dữ liệu mặc định"},
     * ]
    */
    startModal(bntStartModal, dataDefault = []) {

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

        // Nếu có bntStartModal, gắn sự kiện click vào phần tử đó để mở modal

        if (bntStartModal) {
            const element = document.querySelector(bntStartModal);

            if (!check(element, bntStartModal)) return;
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
            this.fillFormWithData(data); // Đổ dữ liệu vào form
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
            // Ẩn form và đóng modal
            this.hideLoading();
            this.form.form.style.display = "flex";
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
        this.resetForm();
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
        const elements = this.form.form.elements;
        for (let item of elements) {
            const name = item.getAttribute("name");
            if (name && data.hasOwnProperty(name)) {
                let value = data[name];
                if (item.hasAttribute("data-choice")) {
                    let id = item.getAttribute("id");
                    let choiceInstance = this.dataChoice[`#${id}`];
                    if (choiceInstance) {
                        choiceInstance.setChoiceByValue(String(value));
                    } else {
                        console.error(`Choice instance for #${id} is not initialized.`);
                    }
                } else {
                    if (this.priceFormat.includes(name)) {
                        item.value = numberFormatHelpers(value);
                    } else if (this.dateFormat.includes(name)) {
                        item.value = dateTimeFormat(value);
                    } else {
                        item.value = value;
                    }
                }
            }
        }
        this.hideLoading();

    }

    /** Reset modal khi đóng */
    resetModal() {
        if (this.modal) {
            this.modal.addEventListener("hidden.bs.modal", () => {
                this.resetForm();
            });
        }
    }

    /** Reset form và các phần tử modal */
    resetForm() {
        if (this.form) {
            this.form.reset.resetForm();
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
                    dom[`text${name}`] = item.textContent;
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
        // lấy ra dữ liệu choices đã được khởi tạo
        this.dataChoice = this.form.choice.choice;

        this.event = new EventHelpers(this.form.form);
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
            let labelValue = "";
    
            // Kiểm tra nếu label là object
            if (typeof label === "object" && !Array.isArray(label)) {
                labelValue = Object.keys(label).map(lblKey => {
                    const itemKey = label[lblKey]; // Giá trị trong object làm key để lấy dữ liệu từ item
                    return lblKey + (item[itemKey] || ""); // Hiển thị key và giá trị
                }).join("");
            } 
            // Nếu label là mảng
            else if (Array.isArray(label)) {
                labelValue = label.map(lbl => item[lbl]).join("-");
            } 
            // Nếu label là string thông thường
            else {
                labelValue = item[label];
            }
    
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
     * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option.
     *  Trong trường hợp bạn có nhiều label thì hãy truyền theo dạng mảng lúc này label của bạn sẽ là value - value ....
     *  Trong trường hợp bạn muốn cấu hình message thì bạn có thể truyền vào 1 object như sau
     *  {"Giá trị 1": GT1, "Giá trị 2": GT2,}
     * 
     * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
     * @param {callback} getParams là 1 callback dùng để lấy các điều kiện phụ trước khi gửi dữ liệu
     * VD:
     * const getParamsFactoryAdd = () => {
            let factory_id = domFormAdd.querySelector("#factory_id");
            return { factory_id: factory_id.value.trim() };
        }
        // thực hiện vệc lắng nghe sự kiện change của resources_type gọi api và đổ ra dữ liệu
        formAdd.select.eventListenerChange("#resources_type", "#resource_id", "/api/vat-tu", "resources_type_id", label, "Chọn vật tư", getParamsFactoryAdd);
     * {Object} params là 1 object chứa các tùy chọn kèm theo khi gửi request
     * {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties. Các trường phụ này sẽ lưu vào thẻ selectEeceive
     * {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
     */
    eventListenerChange(selectChange, selectReceive, api, key, label, labelDefault, getParams = null) {
        let choiceSelectReceive = this.dataChoice[selectReceive];
        if (!check(choiceSelectReceive, selectReceive, "choice")) return;

        this.event.change(selectChange, async (e) => {
            this.request.params = {};
            let value = e.target.value;
            choiceSelectReceive.clearStore();
            choiceSelectReceive._handleLoadingState(true);
            // Gọi getParams ở đây
            let getParam = getParams !== null ? getParams() : {};
            this.request.params = { [key]: value, ...this.params, ...getParam };

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
                        let choiceInstance = this.dataChoice[`#${id}`];
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
                        let choiceInstance = this.dataChoice[`#${id}`];
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
     * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option.
     *  Trong trường hợp bạn có nhiều label thì hãy truyền theo dạng mảng lúc này label của bạn sẽ là value - value ....
     *  Trong trường hợp bạn muốn cấu hình message thì bạn có thể truyền vào 1 object như sau
     *  {"Giá trị 1": GT1, "Giá trị 2": GT2,}
     * @param {string} params là 1 object chứa các tùy chọn kèm theo khi gửi request
     * @param {callback} getParams là 1 callback dùng để lấy các điều kiện phụ trước khi gửi dữ liệu
     * VD:
     * const getParams = () => {
            let params = {};
            let resources_type = domFormAdd.querySelector("#resources_type");
            params.resources_type_id = resources_type.value.trim();
            return params;
        }
        formAdd.select.selectMore("#resource_id", "/api/vat-tu", "searCodeAndName", label, {} ,getParams);
     * customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties.
     * value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
     */
    async selectMore(select, api, key, label, params = {}, getParams = null) {
        let myTimeOut = null;
        let selectDom = document.querySelector(select);
        let choiceSelect = this.dataChoice[select];
        if (!check(selectDom, select)) return;
        if (!check(choiceSelect, select, "choice")) return;
        // Lắng nghe sự kiện tìm kiếm
        this.event.search(select, async (e) => {
            let query = e.detail.value.trim();
            this.request.params = {};
            clearTimeout(myTimeOut);
            myTimeOut = setTimeout(async () => {
                choiceSelect.setChoiceByValue("");
                choiceSelect._handleLoadingState();
                try {
                    // Gọi getParams ở đây
                    let getParam = getParams !== null ? getParams() : {};
                    this.request.params = { [key]: query, ...getParam, ...params };
                    let res = await this.request.getData(api);
                    let dataChoice = this.processApiData(res, label, "");

                    choiceSelect.setChoices(dataChoice, "value", "label", true); // Đổ dữ liệu mới vào select
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
     * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option.
     *  Trong trường hợp bạn có nhiều label thì hãy truyền theo dạng mảng lúc này label của bạn sẽ là value - value ....
     *  Trong trường hợp bạn muốn cấu hình message thì bạn có thể truyền vào 1 object như sau
     *  {"Giá trị 1": GT1, "Giá trị 2": GT2,}
     * @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
     * @param {Array} customProperties  là mảng các chứa tên các trường phụ cần lưu vào customProperties.
     * @param {string} value là phần ky khi api trả về nhận vào đoạn text của thẻ option, Thông thường nó sẽ là id: Nếu bạn muốn sửa lại nó thì ghi đè lại nó nhé :)
     */
    async selectData(select, api, label, labelDefault) {
        // Tìm đối tượng Choices cho selectChange và select
        let choiceSelect = this.dataChoice[select];
        // Kiểm tra nếu đối tượng Choices tồn tại
        if (!choiceSelect) {
            console.error("Không có đối tượng choices này: " + select);
            return;
        }
        choiceSelect._handleLoadingState(true);
        let res = await this.request.getData(api);
        if (res.status === 200) {
            let dataChoice = this.processApiData(res, label, labelDefault);
            // thêm giá trị mặc định
            dataChoice.unshift({ value: "", label: labelDefault });
            // trả dữ liệu về thẻ select
            choiceSelect.setChoices(dataChoice, "value", "label", true);
        }
        choiceSelect._handleLoadingState(false);
    }
}

/**class có tác dụng khởi tạo choice và thực hiện việc lưu trữ cac giá trị choice dã được khởi tạo 
  * @param {string} form Nhận vào 1 form đã được khởi tạo
*/
class ChoiceHelpers {
    constructor(form) {
        this.form = form;
        // lưu trữ khi khởi tạo choice
        this.choice = {};
    }
    /**
   * khởi tạo choice
   * @param {string} choiceArray là mộ mảng chứa id của 1 thẻ
   */
    startChoice() {
        // Lấy tất cả các thẻ <select> bên trong form
        const selectElements = this.form.querySelectorAll("select");
        // Kiểm tra xem choiceArray có phải là một mảng và không rỗng
        if (selectElements.length > 0) selectElements.forEach((item) => {
            // Khởi tạo Choices cho phần tử
            const choiceInstance = new Choices(item, choiceOption);
            // Lưu trữ thông tin về phần tử và đối tượng Choices
            this.choice[`#${item.id}`] = choiceInstance;
        });
    }
}

/**class có tác dụng reset 1 form nào đó
  * @param {string} form Nhận vào 1 form đã được khởi tạo
*/
class ResetHelpers {
    constructor(form) {
        this.form = form;
        // lưu trữ khi khởi tạo choice
        // lấy ra dữ liệu choices đã được khởi tạo
        this.dataChoice = this.form.choice.choice;
        this.notRest = [];
        this.resetArray = [];

        this.elements = this.form.form.elements;
    }
    reset(item) {
        // kiểm tra đối tượng choice
        if (item.hasAttribute("data-choice")) {
            let id = item.getAttribute("id");
            // Tìm đối tượng Choices
            let choiceInstance = this.dataChoice[`#${id}`];
            if (choiceInstance) choiceInstance.setChoiceByValue(""); // Xóa các lựa chọn hiện tại
        } else {
            if (item.tagName === "INPUT" || item.tagName === "TEXTAREA")
                item.value = ""; // Đặt lại giá trị của các phần tử input, select, textarea
        }
    }
    /**
   * khởi tạo choice
   * @param {string} choiceArray là mộ mảng chứa id của 1 thẻ
   */
    resetForm() {
        // Lấy tất cả các phần tử trong form
        for (let item of this.elements) {
            // Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
            if (this.notRest.includes(item.name)) continue;
            this.reset(item);
        }
        clearAllClassValidateHelpers(this.form.form);
    }
    resetInArray() {
        // Lấy tất cả các phần tử trong form
        for (let item of this.elements) {
            // Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
            if (this.resetArray.includes(item.name)) this.reset();
        }
        clearAllClassValidateHelpers(this.form.form);
    }
}

class BaseFormHelpers extends RequestServerHelpers {
    constructor(api, formSelector, validations, modalSelector = "") {
        super(api);
        // lưu trữ khi khởi tạo form
        this.form = document.querySelector(formSelector);
        if (!check(this.form, formSelector)) return;

        this.api = api;
        this.value = "id";
        this.method = "post";

        this.layout = "";
        this.method = "";
        this.debug = "";
        this.param = {};
        this.priceFormat = [];
        this.dateFormat = [];
        this.subdata = {};

        this.exportExcel = false;
        this.responseHandler = false;
        this.resetStatus = true;
        this.modalStatus = true;
        this.statusSubmit = true;

        this.choice = new ChoiceHelpers(this.form);
        // mặc định khởi tạo choice
        this.choice.startChoice();

        this.select = new SelectHelpers(this);

        this.event = new EventHelpers(this.form);
        this.validate = new ValidateHelpers(this.form, validations);
        this.modal = modalSelector !== "" ? new ModalHelpers(this, modalSelector, this.api) : "";
        this.reset = new ResetHelpers(this);
        this.file = new FileHelpers();
        this.url = new URLHelpers();

    }

    getFormData() {
        let data = [];
        let selects = this.form.querySelectorAll("select");
        let inputs = this.form.querySelectorAll("input");

        // Thu thập tất cả các thẻ select, input, textarea vào đối tượng dom
        let collectElements = (elements) => {
            elements.forEach((item) => {
                let name = item.getAttribute("name");
                if (name && item.value) {
                    data[name] = item.value.trim();
                }
            });
        };

        collectElements(selects);
        collectElements(inputs);

        return data;
    }

    setFormData(data) {
        // Lấy tất cả các phần tử trong form
        const elements = this.form.elements;

        for (let item of elements) {
            let name = item.getAttribute("name");
            // tìm kiếm và lấy dữ liệu của data dựa vào name thẻ
            if (name && data.hasOwnProperty(name)) {
                let value = data[name];

                // Kiểm tra nếu phần tử là Choices instance và cập nhật Choices
                if (item.hasAttribute("data-choice")) {
                    let id = item.getAttribute("id");
                    let choiceInstance = this.choice.choice[`#${id}`];
                    choiceInstance.setChoiceByValue(String(value));
                } else {
                    item.value = value;
                }
            }
        }
    }
    /**
     * Định dạng dữ liệu (price, date)
     */
    formatData(data) {
        this.formatFields(data, this.priceFormat, removeCommasHelpers);
        this.formatFields(data, this.dateFormat, convertDateFormatHelpers);
    }

    formatFields(data, fields, formatFunction) {
        fields.forEach((name) => {
            if (data.hasOwnProperty(name)) {
                data[name] = formatFunction(data[name]);
            }
        });
    }

    /**
     * Kiểm tra và xử lý phản hồi từ API
     */
    handleResponse(res) {
        if (this.responseHandler && this.responseHandler.status === res.data.status) {
            this.responseHandler.function();
        }

        if (res.data.status >= 400) {
            this.showError(res.data);
            return false;
        }

        return true;
    }

    showError(errorData) {
        if (errorData.status === 403) {
            this.showErrorResponse(errorData.messageError);
        } else {
            showErrorMD(errorData.messageError);
        }
    }

    /**
     * Xử lý kết thúc sau khi submit form
     */
    finalizeForm(res) {
        if (this.modalStatus) {
            this.form.style.display = "none";
            this.modal.hideModal();
        }

        if (this.resetStatus) {
            this.reset.resetForm();
        }

        if (this.exportExcel) {
            const api = `${this.exportExcel.api}${res.data.data}`;
            this.file.exportExcel("", api, this.exportExcel.name);
        }
    }
    /**
    * Hiển thị lỗi cho các trường trong form
    */
    showErrorResponse(errors) {
        for (let name in errors) {
            const element = this.form.querySelector(`[name="${name}"]`);
            if (element) {
                changeValidateMessage(element, true, errors[name], ["p-2", "small", "text-danger"]);
            }
        }
    }
}

//class làm việc với form
class FormHelpers extends BaseFormHelpers {
    /**
     * @param {string} formSelector Nhận vào id class của 1 form cần khởi tạo
     * @param {Array} validations nhận vào mảng các trường cần kiểm tra, ví dụ:
     * const validations = [
     *  {name: "tên thẻ", condition: value => điều kiện, message: "thông báo người dùng"},
     * ];
     * Nếu cần validate nhiều trường với nhau:
     * const validations = [
     *  {name: ["field1", "field2"], defaultName: "defaultField", condition: (v1, v2) => ..., message: "Thông báo lỗi"},
     * ];
     * @param {string} api đường dẫn API
     * @param {string} method HTTP method (GET, POST, v.v.)
     * @param {Object} layout nhận vào đối tượng layout được khởi tạo
     * @param {string} modal ID modal
     * @param {boolean} [debug=false] Bật chế độ debug để kiểm tra response
     * {boolean} [startHandleFormSubmit=false] Xác định xem có tự động khởi tạo submit hay không
     */
    constructor(formSelector, validations, api, method, layout, modal, debug = false) {
        super(api, formSelector, validations, modal); // Gọi hàm khởi tạo của lớp cha

        this.layout = layout;
        this.method = method;
        this.debug = debug;
        this.callback = null;

        this.startHandleFormSubmit = true;

        if (this.startHandleFormSubmit) this.handleFormSubmit();
    }

    /**
     * Gửi thông tin form
     */
    async submitForm() {
        try {
            let data = this.validate.validateForm();
            if (!data) return false;

            if (Object.keys(this.subdata).length) {
                data = { ...data, ...this.subdata };
            }

            this.formatData(data);

            const res = await axios({
                method: this.method,
                url: this.api,
                data: data,
                params: this.params,
            });

            if (this.debug) {
                console.log(res);
                return false;
            }

            if (this.handleResponse(res)) {
                showMessageMD(res.data[messageSussces]);
                this.finalizeForm(res);
                return { status: true, data: res.data.data };
            }

        } catch (err) {
            showErrorMD("Vui lòng gọi IT");
            console.error(err);
            return { status: false, error: err };
        }
    }

    /**
     * Lắng nghe sự kiện submit của form
     */
    handleFormSubmit() {
        if(this.statusSubmit === false) return;
        this.form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitButton = this.form.querySelector('button[type="submit"]');
            const submitButtonText = submitButton.textContent;
            btnLoading(submitButton, true);

            const response = await this.submitForm();

            // thực hiện công việc sau khi submit
            if (typeof this.callback === "function") {
                this.callback(response);
            }
            btnLoading(submitButton, false, submitButtonText);

            if (response && response.status) {
                await this.layout.dataUI();
            }
        });
    }


}


/**class thao tác với form chứa tabel. Tức là khi bạn ấn submit form mà chưa muốn gọi api giửi đi mà muốn hiển thị lại giao diện cho ngừơi dùng xem*/
class FormTableHelpers extends BaseFormHelpers {
    constructor(formSelector, validations, api, layout, template, modal, debug = false) {
        super(api, formSelector, validations, modal);

        this.debug = debug;
        this.layout = layout;
        this.template = template;

        this.dataTotal = [];
        this.tbody = "#table-body";
        this.domTbody = document.querySelector(this.tbody);
        if (!check(this.domTbody, this.tbody)) return;

        this.btnSendData = "#btn-send-data";
        this.index = 0;

        this.initEventListeners();
        this.callback = "";
    }

    initEventListeners() {
        this.handleFormSubmit();
        this.handleSendData();
    }

    generateUniqueId() {
        return this.index++;
    }

    handleFormSubmit() {
        this.eventHelpers.submit(this.formSelector, (e) => {
            const data = this.validate.validateForm(true);
            if (data !== false) {
                data.id = this.generateUniqueId();
                this.renderRowInTable(data);
                this.dataTotal.push(data);
                this.resetFormInputs();
                if (this.callback) this.callback();
            }
        });
    }

    renderRowInTable(data) {
        const html = `
            <tr id="${data.id}">
                ${this.template(data)}
                <td class="align-middle white-space-nowrap text-center" style="max-width:160px">
                    <button type="button" id="${data.id}" class="btn btn-sm btn-phoenix-secondary text-danger fs-8 deleteBtn">
                        <span class="uil-trash-alt"></span>
                    </button>
                </td>
            </tr>
        `;
        this.domTbody.insertAdjacentHTML('beforeend', html);
        this.addDeleteEventListeners();
    }

    addDeleteEventListeners() {
        this.domTbody.querySelectorAll('.deleteBtn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.currentTarget.id);
                this.deleteDataFromTable(id);
                if (this.callback) this.callback();
            });
        });
    }

    deleteDataFromTable(id) {
        this.dataTotal = this.dataTotal.filter(item => item.id !== id);
        const row = this.domTbody.querySelector(`tr[id="${id}"]`);
        if (row) {
            row.remove();
            showMessageMD("Xóa thành công");
        }
    }

    handleSendData() {
        const btnSendData = document.querySelector(this.btnSendData);
        if (!check(btnSendData, this.btnSendData)) return;

        const btnSendDataTextContent = btnSendData.textContent;
        btnLoading(btnSendData, true);

        this.eventHelpers.click(this.btnSendData, async () => {
            this.dataTotal = this.formInTable ? this.validate.validateRow(this.formInTable) : this.dataTotal;

            if (this.dataTotal && this.dataTotal.length > 0) {
                if (Object.keys(this.subdata).length > 0) {
                    this.dataTotal = { ...this.dataTotal, ...this.subdata };
                }

                this.formatDataBeforeSend();
                const response = await this.sendRequest(this.dataTotal, this.debug, this.method);

                if (this.responseHandler && response && this.responseHandler.status === response.status) {
                    await this.responseHandler.function();
                    this.updateTableData(response.data);
                }

                if (response && response.status >= 200 && response.status < 400) {
                    this.handleSuccessfulResponse(response.data);
                }
            }
        });
        btnLoading(btnSendData, false, btnSendDataTextContent);
    }

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

    exportDataIfNecessary(responseData) {
        if (this.exportExcel && responseData) {
            const api = `${this.exportExcel.api}${responseData}`;
            this.file.exportExcel("", api, this.exportExcel.name);
        }
    }

    resetFormInputs() {
        this.reset.resetForm();
    }

    clearTable() {
        this.domTbody.innerHTML = "";
    }

    handleSuccessfulResponse(responseData) {
        if (this.resetForm) this.resetFormInputs();
        if (this.resetTable) this.clearTable();
        if (this.statusModal) this.modal.hideModal();
        if (this.statusLayout) this.layout.dataUI();
        this.dataTotal = [];
        this.index = 0;
        this.exportDataIfNecessary(responseData);
    }

    updateTableData(responseData) {
        if (this.responseHandler.columnReplaced) {
            const columnReplaced = this.responseHandler.columnReplaced;
            this.dataTotal.forEach(item => {
                item[columnReplaced] = responseData;
            });

            this.domTbody.querySelectorAll(`.${columnReplaced}`).forEach(item => {
                const name = item.getAttribute("name");
                if (name && this.dataTotal.some(data => data[name])) {
                    const value = this.dataTotal.find(data => data[name])[name];
                    this.updateRowData(item, value);
                }
            });
        }
    }

    updateRowData(item, value) {
        if (item.hasAttribute("data-choice")) {
            const id = item.id;
            const choiceInstance = this.choice.choice[`#${id}`];
            if (choiceInstance) {
                choiceInstance.setChoiceByValue(String(value));
            } else {
                console.error(`Choice instance for #${id} is not initialized.`);
            }
        } else {
            item.value = this.priceFormat.includes(item.name) ? numberFormatHelpers(value) : value;
        }
    }
}

/**Class thao tác với lọc dữ liệu
 * @param {string} api api dùng để lọc dữ liệu
 * @param {string} formSelector id class form cần filter
 * @param {object} layout đối tượng layout cần khởi tạo
 */
class FormFilterHelpers extends BaseFormHelpers {
    constructor(api, formSelector, layout) {
        super(api, formSelector);

        this.layout = layout;
        this.hasEventListener = false; // Đánh dấu sự kiện đã được đăng ký
        this.validateLayout();
        this.filterForm();
    }

    /**
     * Kiểm tra xem layout có được khởi tạo hay chưa.
     */
    validateLayout() {
        if (this.layout === "") {
            console.error(
                "Vui lòng khởi tạo layout bằng class LayoutHelpers và thực hiện ghi đè thuộc tính layout!"
            );
            return false;
        }
        return true;
    }

    /**
     * Hiển thị hoặc ẩn trạng thái loading cho nút bấm.
     * @param {HTMLElement} button Nút submit
     * @param {boolean} isLoading Trạng thái loading
     * @param {string} originalText Nội dung gốc của nút submit
     */
    toggleLoading(button, isLoading, originalText = "") {
        btnLoading(button, isLoading, originalText);
    }

    /**
     * Hàm lọc dữ liệu form
     */
    filterForm() {
        if (!this.validateLayout()) return;

        const submitButton = this.form.querySelector('button[type="submit"]');
        if (!submitButton) {
            console.error("Trong form filter không có button nào chứa type=submit");
            return;
        }

        const submitButtonTextContent = submitButton.innerHTML;

        // Kiểm tra xem có URL param hay không và đặt dữ liệu vào form
        let dataParams = this.url.getParams();
        if (Object.keys(dataParams).length > 0) this.setFormData(dataParams);

        if (!this.hasEventListener) {
            this.form.addEventListener("submit", async (e) => {
                e.preventDefault();

                this.toggleLoading(submitButton, true);
                let data = this.getFormData();
                let keysToKeep = ["page", "show_all"];
                this.url.removeParamsExcept(keysToKeep);  // Xóa các tham số không cần thiết
                this.url.addParamsToURL(data); // Đưa các param lên URL

                this.layout.type = "search"; // Gán kiểu tìm kiếm cho layout
                await this.layout.dataUI(); // Gọi API và cập nhật giao diện

                this.toggleLoading(submitButton, false, submitButtonTextContent);
            });
            this.hasEventListener = true;
        }
    }

    /**
     * Hàm xóa lọc dữ liệu form
     * @param {string} deleteFilter ID hoặc class của nút xóa filter
     * @param {callback} callback hàm thực hiện công việc nào đó sau khi xóa
     */
    deleteFilterForm(deleteFilter = "#deleteFilter", callback = null) {
        if (!this.validateLayout()) return;

        const buttonFilter = document.querySelector(deleteFilter);
        if (!check(buttonFilter, deleteFilter)) return;

        buttonFilter.addEventListener("click", async () => {
            this.reset.resetForm(); // Xóa dữ liệu trong form
            let originalText = buttonFilter.innerHTML.trim();

            this.toggleLoading(buttonFilter, true);

            let keysToKeep = ["page", "show_all"];
            this.url.removeParamsExcept(keysToKeep); // Xóa các param trừ những param cần giữ lại
            if(callback !== null) callback();
            await this.layout.dataUI(); // Gọi API và cập nhật giao diện

            this.toggleLoading(buttonFilter, false, originalText);
        });
    }
}


export { FormHelpers, FormTableHelpers, FormFilterHelpers }
