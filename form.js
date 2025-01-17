import { EventHelpers, RequestServerHelpers, FileHelpers, URLHelpers } from "./core.js";
import { formatDataResponse, check, clearAllClassValidateHelpers, convertDateFormatHelpers, numberFormatHelpers, checkDom, applyAttributeData, setFormData } from "./coreFunctions.js";
import { removeCommasHelpers } from "./common.js";

/**Class làm việc với modal */
class ModalHelpers extends RequestServerHelpers {
    /**
     * @param {Object} form đã được khởi tạo bằng class FormHelpers
     * @param {string} modalSelector nhận vào 1 id, class modal
     * @param {string} api được sử dụng khi khởi tạo modal edit
     * @param {boolean = true} closeModalReset sử dụng để xác định xem khi đóng modal có reset hay không. true = reset, false = not reset
     */
    constructor(modalSelector, scope, dataChoice, reset, api = "", priceFormat = [], dateFormat = []) {
        super("");
        this.scope = checkDom(scope);
        this.api = api;
        this.reset = reset;
        this.modalSelector = modalSelector;
        // lấy ra dữ liệu choices đã được khởi tạo
        this.dataChoice = dataChoice;
        this.priceFormat = priceFormat;
        this.dateFormat = dateFormat;
        if (this.modalSelector) {
            this.modal = document.querySelector(this.modalSelector);
            if (!check(this.modal, this.modalSelector)) return;
        }
        this.loading = null;
        this.newModal = null;
        this.flexForm = true;
        this.closeModalReset = true;
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
        let isModalInitialized = false; // Cờ kiểm tra để tránh gọi API nhiều lần

        const openModal = () => {
            this.initializeModal();
            this.showModal();
            this.setLoading();

            // Đổ dữ liệu mặc định vào form nếu có
            if (!isModalInitialized) { // Chỉ gắn sự kiện nếu modal chưa được khởi tạo
                this.modal.addEventListener("shown.bs.modal", async () => {
                    this.hideLoading();
                    if (typeof dataDefault === "function") {
                        const valueDataDefault = await dataDefault();
                        this.fillFormWithDefaults(valueDataDefault);
                    } else {
                        if (dataDefault.length > 0) this.fillFormWithDefaults(dataDefault);
                    }
                });
                isModalInitialized = true; // Đánh dấu modal đã được khởi tạo
            }
        };

        // Nếu có bntStartModal, gắn sự kiện click vào phần tử đó để mở modal
        if (bntStartModal) {
            const element = document.querySelector(bntStartModal);

            if (!check(element, bntStartModal)) return;

            // Đảm bảo sự kiện click chỉ được gắn một lần
            element.removeEventListener("click", openModal);
            element.addEventListener("click", openModal);
        } else {
            openModal();
        }
    }

    /**Hàm có tác dụng :
     * Khởi tạo modal
     * Mở modal
     * gọi api lấy data để đưa vào form
     */

    async showModalWithData(api) {
        this.initializeModal();
        this.showModal();

        // Lấy dữ liệu từ API
        const response = await this.getData(api);
        return response;
    }

    /** Khởi tạo modal edit và đổ dữ liệu từ API 
     * @param {Object} params nhận vào object param
    */
    async startModalEdit(id, params = {}) {
        try {
            this.setLoading();
            this.params = params;
            const formatAPI = this.api + "/" + id;
            const response = await this.showModalWithData(formatAPI);
            await setFormData(response, this.scope, this.dataChoice, this.priceFormat, this.dateFormat); // Đổ dữ liệu vào form
            this.hideLoading();
            return response;
        } catch (error) {
            console.error("Có lỗi xảy ra:", error);
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
            if (this.scope) {
                this.scope.style.display = this.flexForm ? "flex" : "block";
            }
        }
    }

    /** Ẩn modal */
    hideModal() {
        if (this.newModal) {
            this.newModal.hide();
        }
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
            const element = this.scope.querySelector(item.dom);
            if (element) {
                let value = typeof item.value === "function" ? await item.value() : item.value;
                applyAttributeData(element, value, this.dataChoice, this.priceFormat, this.dateFormat)
            } else {
                console.error("Không có phần tử này: " + item.dom + " trong DOM");
            }
        });
    }
}

/**Class có tác dụng thực hiện validate các trường */
class ValidateHelpers {
    constructor(form, validations) {
        this.form = form;
        this.validations = validations;
        this.statusFile = true;
    }

    validateForm(textSelect = false) {
        const dom = this.collectFormElements(textSelect);
        const data = {};
        if (!this.runValidation(dom)) return false;
        for (let key in dom) {
            let item = dom[key];
            if (item && typeof item === "object" && !item.tagName) {
                // Nếu thỏa mãn điều kiện, gán dữ liệu vào mảng data[key]
                data[key] = [];
                for (let subKey in item) {
                    if (item.hasOwnProperty(subKey)) {
                        let input = item[subKey];
                        if (input.checked) {
                            data[key].push(input.value);
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
                    const choiceSelect = this.form.dataChoice[`#${id}`];
                    const choiceSelectObject = choiceSelect.getValue();
                    const value = choiceSelectObject.map(item => item.value);
                    const label = choiceSelectObject.map(item => item.label);
                    data[key] = value;
                    // Lấy text của select nếu textSelect = true
                    if (textSelect) {
                        data[`text_${name}`] = label;
                    }
                } else {

                    // Lấy text của select nếu textSelect = true
                    if (textSelect && item.tagName.toLowerCase() === "select") {
                        data[`text_${name}`] = item.textContent;
                    }
                    data[key] = (item instanceof HTMLElement) ? item.value.trim() : item.trim();
                }
            }
        }
        return data;
    }


    collectFormElements() {
        const elements = [...this.form.form.querySelectorAll("select, input, textarea")];
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


    validateRow(tbodySelector) {
        const rows = tbodySelector.querySelectorAll("tr");
        const data = [];

        for (let row of rows) {
            const dom = this.collectRowElements(row);

            if (!this.runValidation(dom)) return false;

            const rowData = {};
            for (let key in dom) {
                rowData[key] = dom[key].value;
            }
            data.push(rowData);
        }

        return data;
    }

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

    runValidation(dom) {
        for (let { name, defaultName, condition, message, whereToReportBugs } of this.validations) {
            if (Array.isArray(name)) {
                let fieldValues = name.map((item) => dom[item]?.value);
                if (!this.checkMultipleFields(fieldValues, name, condition, dom, message, defaultName)) return false;
            } else {
                let field = dom[name];
                if (field && typeof field === "object" && !field.tagName) {
                    if (!this.checkMultipleFieldsWithCheckboxAttribute(field, condition, message, whereToReportBugs)) return false;
                } else {
                    if (!this.checkSingleField(field, condition, message)) return false;
                }
            }
        }
        return true;
    }


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

    /**Hàm có tác dụng kiểm tra nhiều đối với thuộc tính checkbox
     * @param {object} field danh sách dom có cùng tên và thuộc tính checkbox
     * @param {function} condition hàm thực thi điều kiện
     * @param {string} whereToReportBugs id hoặc class nơi thông báo lỗi cho toàn bộ thẻ checkbox
     */
    checkMultipleFieldsWithCheckboxAttribute(field, condition, message, whereToReportBugs) {
        let isValid = false;

        // Kiểm tra điều kiện của các input
        for (let key in field) {
            if (field.hasOwnProperty(key)) {
                let input = field[key];
                if (condition(input.value, input)) {
                    isValid = true;
                    break; // Dừng vòng lặp nếu thỏa mãn điều kiện
                }
            }
        }

        const reportElement = this.form.form.querySelector(whereToReportBugs);

        if (!isValid) {

            // Thêm thông báo lỗi tổng quát (nếu chỉ định `whereToReportBugs`)
            if (reportElement) {
                reportElement.innerHTML = `<div class="show-error text-danger p-2 small">${message}</div>`
            } else {
                // Thêm thông báo lỗi và hiệu ứng cho các input không hợp lệ
                for (let key in field) {
                    if (field.hasOwnProperty(key)) {
                        let input = field[key];
                        changeValidateMessage(input, true, message, ["p-2", "small"]);
                    }
                }
            }

            return false;
        } else {

            // Xóa lỗi tổng quát (nếu chỉ định `whereToReportBugs`)
            if (reportElement) {
                reportElement.innerHTML = ``
            } else {
                // Xóa lỗi cho tất cả các input nếu hợp lệ
                for (let key in field) {
                    if (field.hasOwnProperty(key)) {
                        let input = field[key];
                        changeValidateMessage(input, false, "", []);
                    }
                }
            }

            return true;
        }
    }


    checkSingleField(field, condition, message) {
        // Trường hợp field là một thẻ HTML
        if (!condition(field.value, field)) {
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

/**Class có tác dụng làm việc với thẻ select 
 * @param {Object} dataChoice Object chứa các đối tượng choice đã được khởi tạo từ class choice
 * @param {Object} event Đối tượng được khởi tạo từ class event
 * @param {dom} scope phạm vi có thể truy cập được của thẻ select. Nếu không truyền thì phạm vi là document
*/
class SelectHelpers extends RequestServerHelpers {

    constructor(dataChoice, event, scope) {
        super("");
        this.scope = checkDom(scope);
        this.params = {};
        this.value = "id";
        this.customProperties = [];
        // lấy ra dữ liệu choices đã được khởi tạo
        this.dataChoice = dataChoice;
        this.event = event;
    }

    /**Hàm có tác dụng tạo ra mảng dataChoice từ data
     * @param {array} data mảng dữ liệu dùng để chuyển sang data choice
     * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option.
     */
    createDataChoice(data, label) {
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
                value: String(item[this.value]),
                customProperties: customProps,
            };
        });
    }

    // Hàm xử lý chung cho dữ liệu trả về và thiết lập cho Choices
    processApiData(res, label, labelDefault) {

        let data = formatDataResponse(res);
        if (data.length == 0) {
            return [{ value: "Không có dữ liệu", label: labelDefault }];
        }
        return this.createDataChoice(data, label);
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


    /**Hàm có tác dụng lắng nghe sự change của 1 thẻ select và gọi API và đổ dữ liệu ra 1 thẻ select khác
     * @param {string} selectChange ID, Class của thẻ được lắng nghe
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
            this.params = {};
            let value = e.target.value;
            choiceSelectReceive.clearStore();
            choiceSelectReceive._handleLoadingState(true);
            // Gọi getParams ở đây
            let getParam = getParams !== null ? getParams() : {};
            this.params = { [key]: value, ...this.params, ...getParam };

            let res = await this.getData(api);
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
        const domSelectChange = this.scope.querySelector(selectChange);
        if (!check(domSelectChange, selectChange)) return;
        // Kiểm tra xem receive là mảng hay chuỗi và thiết lập domReceive
        const isReceiveArray = Array.isArray(receive);
        const domReceive = isReceiveArray ? null : this.scope.querySelector(receive);
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
                    let dom = this.scope.querySelector(item.dom);
                    applyAttributeData(dom, dataCustomProperties, this.dataChoice);
                });
            } else if (api) {
                applyAttributeData(domReceive, data[value], this.dataChoice);
            } else {
                applyAttributeData(domReceive, data, this.dataChoice);
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
                try {
                    // Gửi yêu cầu GET đến API
                    const data = await this.getData(`${api}?${key}=${e.target.value}`);
                    let dataToDisplay = "Không tìm thấy dữ liệu";
                    if (!isReceiveArray) {
                        dataToDisplay = data[value];
                    } else {
                        dataToDisplay = data;
                    }
                    updateReceive(dataToDisplay);
                } catch (error) {
                    console.error("Lỗi khi gọi API: ", error);
                }
            } else if (isReceiveArray) {
                const dataCustomProperties = selectedChoice.customProperties;
                updateReceive(dataCustomProperties);
            } else {
                const selectedOption = e.target.options[e.target.selectedIndex];
                updateReceive(selectedOption.text);
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

        const domReceive = isReceiveArray ? null : this.scope.querySelector(`[name="${receive}"]`);

        if (!isReceiveArray && !domReceive) {
            console.error("Không tìm thấy id hoặc class này: " + receive);
            return;
        }

        // Hàm xử lý cập nhật dữ liệu vào domReceive hoặc danh sách domReceive
        const clearReceive = () => {
            if (isReceiveArray) {
                receive.forEach((item) => {
                    // Chỉ cho phép tìm các phần tử ở trong form
                    let dom = this.scope.querySelector(`[name="${item}"]`);
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

    /**Lắng nghe sự kiện tìm thêm dữ liệu
     * @param {string} select ID, Class của thẻ được chọn
     * @param {string} api api nhận lấy ra dữ liệu
     * @param {string} key nhận vào param của api,
     * @param {string} label là phần ky khi api trả về nhận vào value của thẻ option.
     *  Trong trường hợp bạn có nhiều label thì hãy truyền theo dạng mảng lúc này label của bạn sẽ là value - value ....
     *  Trong trường hợp bạn muốn cấu hình message thì bạn có thể truyền vào 1 object như sau
     *  {"Giá trị 1": GT1, "Giá trị 2": GT2,}
     *  @param {string} labelDefault là phần value của thẻ option luôn được hiển thị mặc định
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
    async selectMore(select, api, key, label, labelDefault, params = {}, getParams = null) {
        let myTimeOut = null;
        let selectDom = document.querySelector(select);
        let choiceSelect = this.dataChoice[select];
        if (!check(selectDom, select)) return;
        if (!check(choiceSelect, select, "choice")) return;
        // Lắng nghe sự kiện tìm kiếm
        this.event.search(select, async (e) => {
            let query = e.detail.value.trim();
            this.params = {};
            clearTimeout(myTimeOut);
            myTimeOut = setTimeout(async () => {
                choiceSelect.setChoiceByValue("");
                choiceSelect._handleLoadingState();
                try {
                    // Gọi getParams ở đây
                    let getParam = getParams !== null ? getParams() : {};
                    this.params = { [key]: query, ...getParam, ...params };
                    let res = await this.getData(api);
                    let dataChoice = this.processApiData(res, label, "");
                    dataChoice.unshift({ value: "", label: labelDefault });
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
        // choiceSelect._handleLoadingState(true);
        let res = await this.getData(api);
        let dataChoice = this.processApiData(res, label, labelDefault);
        this.setDataChoice(choiceSelect, dataChoice, labelDefault);
        // choiceSelect._handleLoadingState(false);
    }

    /**Hàm có tác dụng gắn dataChoice cho choice
     * @param {Object} choice đối tượng choice
     * @param {Array} dataChoice mảng dữ liệu cần gắn
     * @param {String} labelDefault giá trị mặc định của thẻ option
     */
    setDataChoice(choice, dataChoice, labelDefault) {
        dataChoice.unshift({ value: "", label: labelDefault });
        // trả dữ liệu về thẻ select
        choice.setChoices(dataChoice, "value", "label", true);
    }
}

/**Class có tác dụng khởi tạo daterangepicker 
 * @param {dom} scope phạm vi có thể truy cập được của thẻ select. Nếu không truyền thì phạm vi là document
*/
class DatePickerHelpers {
    constructor(scope) {
        this.scope = checkDom(scope);
        this.dataDate = {};
        moment.locale('vi');
        this.typeFormat = 'DD/MM/YYYY'; // Định dạng ngày
        this.timeFormat = 'HH:mm:ss';         // Định dạng thời gian
    }

    // Hàm callback để thiết lập giá trị ngày cho input
    cb(start, end, element) {
        let cont = start.format(this.typeFormat) + ' - ' + end.format(this.typeFormat);
        if (start.format(this.typeFormat) === end.format(this.typeFormat)) {
            cont = start.format(this.typeFormat);
        }
        $(element).val(cont);
    }

    // Hàm tạo ranges linh hoạt dựa trên giá trị start
    getRanges(start) {
        return {
            'Hôm nay': [start.clone(), start.clone()],
            'Hôm qua': [start.clone().subtract(1, 'days'), start.clone().subtract(1, 'days')],
            '7 ngày qua': [start.clone().subtract(6, 'days'), start.clone()],
            '30 ngày qua': [start.clone().subtract(29, 'days'), start.clone()],
            'Tháng này': [start.clone().startOf('month'), start.clone().endOf('month')],
            'Tháng trước': [
                start.clone().subtract(1, 'month').startOf('month'),
                start.clone().subtract(1, 'month').endOf('month')
            ],
            'Tất cả thời gian': [
                start.clone().subtract(10, 'year').startOf('day'),
                start.clone().endOf('day')
            ]
        };
    }

    // Hàm kiểm tra ngày hợp lệ theo định dạng
    isValidDate(value, format) {
        return moment(value, format, true).isValid();
    }

    // Hàm khởi tạo daterangepicker
    initDatePicker(selector, start, options = {}) {
        $(this.scope).find(selector).each((index, input) => {
            const $input = $(input);
            $input.attr('autocomplete', 'off');
            $input.daterangepicker({
                startDate: start,
                singleDatePicker: options.singleDatePicker || false,
                maxDate: options.maxDate || null,
                minDate: options.minDate || null,
                showDropdowns: true,                // Hiển thị dropdown chọn tháng/năm
                autoApply: false,
                locale: {
                    format: this.typeFormat,
                    applyLabel: "Áp dụng",
                    cancelLabel: "Hủy",
                    fromLabel: "Từ",
                    toLabel: "Đến",
                    customRangeLabel: "Tùy chỉnh",
                    daysOfWeek: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
                    monthNames: [
                        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5",
                        "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                    ],
                    firstDay: 1
                },
                ranges: this.getRanges(start)
            });

            // Kiểm tra giá trị khi người dùng nhập thủ công
            $input.on('blur', () => {
                const value = $input.val();
                if (!this.isValidDate(value, this.typeFormat)) {
                    // Nếu giá trị không hợp lệ, đặt lại giá trị mặc định
                    $input.val(start.format(this.typeFormat));
                }
            });
        });
    }

    // Hàm khởi tạo timepicker
    initTimePicker(selector) {
        $(this.scope).find(selector).each((index, input) => {
            const $input = $(input);
            $input.attr('autocomplete', 'off');

            // Đặt giá trị mặc định là thời gian hiện tại
            const defaultTime = moment().format(this.timeFormat);
            $input.val(defaultTime);

            $(input).daterangepicker({
                timePicker: true,              // Bật tính năng chọn giờ
                timePicker24Hour: true,        // Định dạng 24 giờ
                timePickerSeconds: true,       // Hiển thị giây
                singleDatePicker: true,        // Chỉ cho phép chọn 1 giá trị
                showDropdowns: false,          // Ẩn các dropdown năm/tháng
                autoApply: true,               // Tự động áp dụng khi chọn thời gian
                opens: 'center',               // Vị trí hiển thị
                locale: {
                    customRangeLabel: "Giờ:phút:giây",
                    format: this.timeFormat,   // Chỉ định dạng thời gian
                    applyLabel: 'Áp dụng',
                    cancelLabel: 'Hủy',
                },
                isInvalidDate: () => true,     // Loại bỏ mọi giá trị ngày tháng
                ranges: {},                    // Không thêm các tùy chọn range
            }, function (start) {
                $input.val(start.format('HH:mm:ss')); // Cập nhật thời gian khi chọn
            });

            // Khi người dùng nhập thủ công
            $input.on('blur', () => {
                const value = $input.val();
                if (!moment(value, this.timeFormat, true).isValid()) {
                    // Nếu không hợp lệ, đặt lại thời gian hiện tại
                    $input.val(defaultTime);
                }
            });
        });
    }

    // Phương thức khởi tạo các daterangepicker cần thiết
    initialize() {
        this.initDatePicker('input.start-date-picker-default-this-month', moment().startOf('month'));
        this.initDatePicker('input.start-date-picker', moment());
        this.initDatePicker('input.start-date-picker-single', moment(), { singleDatePicker: true });
        this.initDatePicker('input.start-date-picker-single-max-today', moment(), { singleDatePicker: true, maxDate: moment() });
        this.initDatePicker('input.start-date-picker-max-today', moment().subtract(7, 'days'), { maxDate: moment() });
        this.initDatePicker('input.start-date-picker-min-today', moment(), { minDate: moment() });
        this.initTimePicker('input.time-picker'); // Khởi tạo timepicker
    }
}

/**class có tác dụng khởi tạo choice và thực hiện việc lưu trữ cac giá trị choice dã được khởi tạo 
  * @param {string} scope Nhận vào 1 dom đã được khởi tạo làm phạm vi
*/
class ChoiceHelpers {
    constructor(scope) {
        this.scope = checkDom(scope);
        // lưu trữ khi khởi tạo choice
        this.choice = {};
    }
    /**
   * khởi tạo choice
   * @param {string} choiceArray là mộ mảng chứa id của 1 thẻ
   */
    startChoice() {
        // Lấy tất cả các thẻ <select> bên trong scope
        const selectElements = this.scope.querySelectorAll("select");
        // Kiểm tra xem choiceArray có phải là một mảng và không rỗng
        const selectElementsLength = selectElements.length;
        if (selectElementsLength > 0) {
            for (let i = 0; i < selectElementsLength; i++) {
                let item = selectElements[i];
                if (!item.id) {
                    console.error("Thẻ select bắt buộc phải có id mới khởi tạo được choices !", item);
                    return; // Bỏ qua phần tử này và không khởi tạo Choices
                }
                choiceOptions.removeItemButton = item.multiple ? true : false;
                // Khởi tạo Choices cho phần tử
                const choiceInstance = new Choices(item, choiceOptions);
                // Lưu trữ thông tin về phần tử và đối tượng Choices
                this.choice[`#${item.id}`] = choiceInstance;
            }
        }
    }
}

/**class có tác dụng reset 1 form nào đó
  * @param {string} form Nhận vào 1 form đã được khởi tạo
*/
class ResetHelpers {
    constructor(scope, dataChoice, datePicker) {
        this.scope = checkDom(scope);
        this.dataChoice = dataChoice;
        this.datePicker = datePicker;
        this.notRest = [];
        this.resetArray = [];

        this.elements = this.scope.elements;
    }

    reset(item) {
        // kiểm tra đối tượng choice
        if (item.hasAttribute("data-choice")) {
            let id = item.getAttribute("id");
            // Tìm đối tượng Choices
            let choiceInstance = this.dataChoice[`#${id}`];
            if (choiceInstance) {
                // Xóa các lựa chọn hiện tại
                choiceInstance.setChoiceByValue("");
                if (item.multiple) {
                    choiceInstance.removeActiveItems();
                }
            }
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
        // cập nhật lại ngày tháng
        this.datePicker.initialize();
        // Lấy tất cả các phần tử trong form
        for (let item of this.elements) {
            const className = item.getAttribute('class');
            // Không xóa trắng với tất cả phần tử có class bắt đầu với 'start-date-picker'
            if (className) {
                const checkDatePicker = className.split(" ").some(classItem => classItem.startsWith('start-date-picker'));
                if (checkDatePicker) continue;
            }
            // Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
            if (this.notRest.includes(item.name)) {
                continue
            };
            // Không reset với input có type là radio hoặc checkbox
            if (item.type === "radio" || item.type === "checkbox") continue;
            this.reset(item);
        }
        clearAllClassValidateHelpers(this.scope);
    }
    resetInArray() {
        // cập nhật lại ngày tháng
        this.datePicker.initialize();
        // Lấy tất cả các phần tử trong form
        for (let item of this.elements) {
            const className = item.getAttribute('class');
            // Không xóa trắng với tất cả phần tử có class bắt đầu với 'start-date-picker'
            const checkDatePicker = className.split(" ").some(classItem => classItem.startsWith('start-date-picker'));
            if (checkDatePicker) continue;
            // Nếu tên phần tử nằm trong mảng notRest, bỏ qua phần tử đó
            if (this.resetArray.includes(item.name)) this.reset();
        }
        clearAllClassValidateHelpers(this.scope);
    }
}

class BaseFormHelpers extends RequestServerHelpers {
    constructor(api, formSelector, validations, modalSelector = "", priceFormat = [], dateFormat = []) {
        super(api);
        // lưu trữ khi khởi tạo form
        this.form = document.querySelector(formSelector);
        this.api = api;
        this.method = "post";

        this.layout = "";
        this.debug = "";
        this.priceFormat = priceFormat;
        this.dateFormat = dateFormat;
        this.subdata = {};

        this.exportExcel = false;
        this.responseHandler = false;
        this.resetStatus = true;
        this.modalStatus = true;
        this.statusSubmit = true;

        this.choice = new ChoiceHelpers(this.form);
        // mặc định khởi tạo choice
        this.choice.startChoice();
        this.dataChoice = this.choice.choice;

        this.event = new EventHelpers(this.form);
        this.select = new SelectHelpers(this.dataChoice, this.event, this.form);

        this.validate = new ValidateHelpers(this, validations);
        this.datePicker = new DatePickerHelpers(this.form);
        // mặc định khởi tạo date picker
        this.datePicker.initialize();
        this.reset = new ResetHelpers(this.form, this.dataChoice, this.datePicker);
        this.modal = new ModalHelpers(modalSelector, this.form, this.dataChoice, this.reset, this.api, this.priceFormat, this.dateFormat);
        this.file = new FileHelpers();
    }

    // Hàm có tác dụng lấy dữ liệu trong form
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

    /**
     * @param {boolean} [statusTable=false] Trạng thái khi format dữ liệu cho table form. Mặc định là không
     * Định dạng dữ liệu trước khi gửi lên backend (price, date)
     * từ 500,000 thành 500000
     */
    formatData(data, statusTable = false) {
        if (!statusTable) {
            this.formatFields(data, this.priceFormat, removeCommasHelpers);
            this.formatFields(data, this.dateFormat, convertDateFormatHelpers);
        } else {
            this.formatFieldsTable(data, this.priceFormat, removeCommasHelpers);
            this.formatFieldsTable(data, this.dateFormat, convertDateFormatHelpers);
        }
        return data;
    }

    // Thực hiện format dữ liệu
    formatFields(data, fields, formatFunction) {
        fields.forEach((name) => {
            if (data.hasOwnProperty(name)) {
                data[name] = formatFunction(data[name]);
            }
        });
        return data;
    }

    // Thực hiện format cho bảng
    formatFieldsTable(data, fields, formatFunction) {
        data.forEach((item) => {
            this.formatFields(item, fields, formatFunction);
        });
        return data;
    }

    /**
     * Kiểm tra và xử lý phản hồi từ API
     */
    handleResponse(res) {

        if (this.responseHandler && this.responseHandler.status === res.status) {
            this.responseHandler.function(res);
        }

        if (res.status >= 400) {
            this.showError(res);
            return false;
        }
        else if (res === false) {
            return false;
        }
        else {
            showMessageMD(res.message);
            return true;
        }
    }

    /**Hiển thị lỗi sau khi submit
     * @param {object} responseError object lỗi được trả về
     */
    showError(responseError) {
        if (responseError.status === 403 || responseError.status === 422) {
            this.showErrorResponse(responseError.message);
        }
        else {
            showErrorMD(responseError.message);
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

        this.exportFileAfterSenData(res);
    }

    // Hàm có tác dụng xuất file sau khi gửi dữ liệu
    exportFileAfterSenData(response) {
        if (this.exportExcel && response) {
            const api = `${this.exportExcel.api}${response}`;
            this.file.exportExcel("", api, this.exportExcel.name);
        }
    }

    /**
    * Hiển thị lỗi cho các trường trong form
    */
    showErrorResponse(errors) {

        // Thực hiện xóa toàn bộ lỗi trước khi gắn lại lỗi mới
        removeAllValidationClasses(this.form);
        for (let name in errors) {
            const element = this.form.querySelector(`[name="${name}"]`);
            if (element) {
                let message = "";
                if (typeof errors[name] === "object") {
                    message = errors[name][0];
                } else {
                    message = errors[name];
                }
                changeValidateMessage(element, true, message, ["p-2", "small", "text-danger"]);
            }
        }
    }

    /**Hàm có tác dụng add dữ liệu sang dạng FromData 
     * @param {array} data nhận vào 1 mảng chứa các object dữ l
    */
    addFromData(data) {
        const formData = new FormData();
        // Duyệt qua các thuộc tính của data và thêm vào FormData
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] instanceof FileList) {
                    for (let i = 0; i < data[key].length; i++) {
                        formData.append(`${key}[]`, data[key][i]);
                    }
                } else {
                    formData.append(key, data[key]);
                }
            }
        }
        return formData;
    }
    /**Hàn có tác dụng gửi dữ liệu dựa trên method yêu cầu
     * @param {array} data nhận vào 1 mảng chứa các object dữ l
     * @param {string} method nhận vào method cần gửi
     */
    async sendFormData(data, method, debug) {
        var response;
        switch (method.toLowerCase()) {
            case "post":
                response = await this.postData(data, debug);
                break;
            case "put":
                response = await this.putData(data, debug, this.api);
                break;
            default:
                console.error("method không được hỗ trợ vui lòng chọn method khác: " + method);
                response = false;
                break;
        }
        return response;
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
    constructor(formSelector, validations, api, method, layout, modal, priceFormat = [], dateFormat = [], debug = false) {
        super(api, formSelector, validations, modal, priceFormat, dateFormat); // Gọi hàm khởi tạo của lớp cha
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

        let data = this.validate.validateForm();
        if (!data) return false;

        if (Object.keys(this.subdata).length) {
            data = { ...data, ...this.subdata };
        }
        this.formatData(data);
        if (this.headers["Content-Type"] === "multipart/form-data") {
            data = this.addFromData(data);
        }

        let response = await this.sendFormData(data, this.method, this.debug);
        if (this.debug == false && response !== false && this.handleResponse(response)) {
            this.finalizeForm(response);
            this.reset.resetForm();
            return { status: true, data: response.data };
        }
    }

    /**
     * Lắng nghe sự kiện submit của form
     */
    handleFormSubmit() {
        if (this.statusSubmit === false) return;
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
                await this.layout.renderUI();
            }
        });
    }
}

/**class thao tác với form chứa tabel. Tức là khi bạn ấn submit form mà chưa muốn gọi api giửi đi mà muốn hiển thị lại giao diện cho ngừơi dùng xem
 * Thực hiện khởi tạo form như bình thường
 * Trong trường hợp table của bạn có chứa các ô input để nhập dữ liệu thì cần sét thuộc tính formInTable = true
*/
class FormTableHelpers extends BaseFormHelpers {
    constructor(formSelector, validations, api, layout, template, modal, priceFormat = [], dateFormat = [], debug = false) {
        super(api, formSelector, validations, modal, priceFormat, dateFormat);

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
        this.formInTable = false;

        this.resetForm = true;
        this.resetTable = true;
        this.statusModal = true;
        this.statusLayout = true;
    }

    initEventListeners() {
        this.handleFormSubmit();
        this.handleSendData();
    }

    generateUniqueId() {
        return this.index++;
    }

    // Hàm có tác dụng đưa dữ liệu vào bảng
    handleFormSubmit() {
        this.event.submit(this.form, (e) => {
            const data = this.validate.validateForm(true);
            if (data !== false) {
                data.id = this.generateUniqueId();
                this.renderRowInTable(data);
                this.dataTotal.push(data);
                if (this.callback) this.callback();
                this.reset.resetForm();
            }
        });
    }

    // Hàm có tác dụng thực hiện đưa dữ liệu đã được gép với html và đưa vào dom
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

    // Lắng nghe sự kiện xóa dữ liệu ở trong bảng
    addDeleteEventListeners() {
        this.domTbody.querySelectorAll('.deleteBtn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.currentTarget.id);
                this.deleteDataFromTable(id);
                if (this.callback) this.callback();
            });
        });
    }

    // Thực hiện xóa dữ liệu trong bảng và trong mảng dataTotal
    deleteDataFromTable(id) {
        this.dataTotal = this.dataTotal.filter(item => item.id !== id);
        const row = this.domTbody.querySelector(`tr[id="${id}"]`);
        if (row) {
            row.remove();
        }
    }

    handleSendData() {
        const btnSendData = document.querySelector(this.btnSendData);
        if (!check(btnSendData, this.btnSendData)) return;

        const btnSendDataTextContent = btnSendData.textContent;
        btnSendData.addEventListener("click", async () => {
            btnLoading(btnSendData, true);
            let dataTotal = this.formInTable ? this.validate.validateRow(this.domTbody) : this.dataTotal;
            if (dataTotal && dataTotal.length > 0) {
                if (Object.keys(this.subdata).length > 0) {
                    dataTotal = { ...dataTotal, ...this.subdata };
                }
                // Thực hiện format dữ liệu trước khi gửi lên backend, nếu người dùng ghi đè lại thuộc tính this.priceFormat hoặc this.dateFormat
                dataTotal = this.formatData(dataTotal, true);
                const response = await this.sendFormData(dataTotal, this.method, this.debug);

                if (this.responseHandler && response && this.responseHandler.status === response.status) {
                    await this.responseHandler.function(response);
                    this.updateTableData(response.data);
                }
                if (response && response.status == 200 && response.status < 400) {
                    this.handleSuccessfulResponse(response.data);
                } else {
                    this.showError(response);
                    return false;
                }
            }
            btnLoading(btnSendData, false, btnSendDataTextContent);
        })
    }
    handleSuccessfulResponse(responseData) {
        if (this.resetForm) this.reset.resetForm();
        if (this.resetTable) this.domTbody.innerHTML = "";
        if (this.statusModal) this.modal.hideModal();
        if (this.statusLayout) this.layout.renderUI();
        this.dataTotal = [];
        this.index = 0;
        showMessageMD(responseData.message);
        this.exportFileAfterSenData(responseData);
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
    constructor(api, formSelector, layout, priceFormat = [], dateFormat = []) {
        super(api, formSelector, [], "", priceFormat, dateFormat);
        this.url = new URLHelpers();
        this.keysToKeep = [];
        this.defaultKeysToKeep = ["page", "show_all"];
        this.layout = layout;
        this.hasEventListener = false; // Đánh dấu sự kiện đã được đăng ký
        this.btnDeleteFilter = "#deleteFilter";
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
        if (Object.keys(dataParams).length > 0) setFormData(dataParams, this.form, this.dataChoice, this.priceFormat, this.dateFormat);

        if (!this.hasEventListener) {
            this.form.addEventListener("submit", async (e) => {
                e.preventDefault();

                this.toggleLoading(submitButton, true);
                let data = this.getFormData();
                let keysToKeep = [...this.defaultKeysToKeep, ...this.keysToKeep];
                this.url.removeParamsExcept(keysToKeep); // Xóa các param trừ những param cần giữ lại
                this.url.addParamsToURL(data); // Đưa các param lên URL

                this.layout.type = "search"; // Gán kiểu tìm kiếm cho layout
                await this.layout.renderUI(); // Gọi API và cập nhật giao diện

                this.toggleLoading(submitButton, false, submitButtonTextContent);
            });
            this.hasEventListener = true;
        }
    }

    /**
     * Hàm xóa lọc dữ liệu form
     * @param {string} deleteFilter ID hoặc class của nút xóa filter
     * @param {array} paramsNotDelete Mảng các key ở trên url mà bạn không muốn xóa
     * VD: deleteFilterForm(["resource_type"]);
     * @param {callback} callback hàm thực hiện công việc nào đó sau khi xóa
     */
    deleteFilterForm(paramsNotDelete = [], callback = null) {
        if (!this.validateLayout()) return;

        const buttonFilter = document.querySelector(this.btnDeleteFilter);
        if (!check(buttonFilter, this.btnDeleteFilter)) return;

        buttonFilter.addEventListener("click", async () => {
            this.reset.resetForm(); // Xóa dữ liệu trong form
            let originalText = buttonFilter.innerHTML.trim();

            this.toggleLoading(buttonFilter, true);

            let keysToKeep = [...this.defaultKeysToKeep, ...paramsNotDelete, ...this.keysToKeep];
            this.url.removeParamsExcept(keysToKeep); // Xóa các param trừ những param cần giữ lại
            if (callback !== null) callback();
            // thực hiện lấy ra params default
            let dataParams = this.layout.getDefaultParam();
            // đưa params default vào form
            if (Object.keys(dataParams).length > 0) setFormData(dataParams, this.form, this.dataChoice, this.priceFormat, this.dateFormat);
            await this.layout.renderUI(); // Gọi API và cập nhật giao diện

            this.toggleLoading(buttonFilter, false, originalText);
        });
    }
}


export { FormHelpers, FormTableHelpers, FormFilterHelpers, ModalHelpers, BaseFormHelpers, ResetHelpers, ChoiceHelpers, SelectHelpers, ValidateHelpers, DatePickerHelpers }
