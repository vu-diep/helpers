import { formatApiUrl, check} from "./coreFunctions.js";
// xác định message trả về
const messageError = "error";
const messageSussces = "success";

/**
 * class giao tiếp với server
 * @param {string} route API cần sử dụng cho việc request server
 * @param {object} params các params cần gửi đi
 * @param {bolean=true} statusMessage xác định xem có cần thông báo xong sau khi gửi request server không. Nếu bạn để false thì cả thông báo lỗi và thông báo thành công sẽ không được hiển thị
 */
class RequestServerHelpers {
  constructor(route) {
    this.route = route;
    this.params = {};
    this.statusMessage = true
    this.headers = {'Content-Type': 'application/json',};
  }

  /**Hàm có tác dụng lấy ra dữ liệu
   * @param {string} [api=""] Nhận vào api lấy dữ liệu
   */
  async getData(api = "") {
    const formatAPI = api === "" ? this.route : api;
    const response = await axios.get(formatAPI, {
      params: this.params,
    });
    return response.data;
  }

  /**Hàm có tác dụng gửi dữ liệu
   * @param {string} [api=""] Nhận vào api gửi dữ liệu
   */
  async postData(data, debug = false, api = "") {
    const formatAPI = api === "" ? this.route : api;
    let response;
    try {
      response = await axios.post(formatAPI, data, {
        params: this.params,
        headers: {...this.headers}
      });
      
      if (debug) {
        console.log(response);
        return;
      }
      return {status: response.status, message: response.data.message, data: response.data};
    } catch (error) {
      return {status: error.response.status, message: error.response.data.message}
    }
  }
  

    /**Hàm có tác dụng gửi dữ liệu
   * @param {string} [api=""] Nhận vào api gửi dữ liệu
   */
    async putData(data, debug = false, api = "") {
      const formatAPI = api === "" ? this.route : api;
      let response;
      try {
        response = await axios.put(formatAPI, data, {
          params: this.params,
          headers: {...this.headers}
        });
        
        if (debug) {
          console.log(response);
          return false;
        }
        return {status: response.status, message: response.data.message, data: response.data};
      } catch (error) {
        return {status: error.response.status, message: error.response.data.message}
      }
    }

  /**Hàm có tác dụng thực hiện gửi dữ liệu theo ý người dùng . Chỉ thực hiện gửi dữ liệu theo param với số lượng ít.
   * @param {string} [api=""] Nhận vào api xóa dữ liệu
   */
  async requestData(method, api = "") {
    const formatAPI = api === "" ? this.route : api;
    const response = await axios({
      method: method,
      url: formatAPI,
      params: this.params,
    });
    if (this.statusMessage) {
      if (response.data.status >= 400) {
        showErrorMD(response.data[messageError]);
      } else {
        showMessageMD(response.data[messageSussces]);
      }
    }
    return response.data; // Trả về dữ liệu thành công
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

  /**Hàm có tác dụng lấy ra param trên url
   * @param {string} [key=""] nhận vào key của param nếu bạn chỉ cần lấy 1 trường cụ thế. Nếu bạn muốn lấy tất cả param có trên url thì không cần quan tâm đến trường này
   */
  getParams(key = "") {
    // Lấy URL hiện tại từ window.location
    const params = new URLSearchParams(window.location.search);

    // Nếu key không phải là chuỗi rỗng, trả về giá trị của key
    if (key !== "") {
      return params.get(key);
    }

    // Nếu key rỗng, trả về toàn bộ danh sách các tham số
    const paramList = {};
    for (let [paramKey, value] of params.entries()) {
      paramList[paramKey] = value;
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

    // Tạo một danh sách các tham số để giữ lại
    for (let key of Array.from(params.keys())) {
      if (!keysToKeep.includes(key)) {
        params.delete(key); // Xóa tham số không nằm trong danh sách keysToKeep
      }
    }

    // Cập nhật URL mới với các tham số đã được xóa
    urlObj.search = params.toString();
    let newUrl = urlObj.toString();

    // Thay thế URL chỉ một lần sau khi tất cả các tham số đã được xử lý
    if (newUrl !== url) {
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }

  /** hàm có tác dụng thêm param vào url
   * @param {object} params nhận vào object chứa các param muốn truyền
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
    this.originalText = this.btnConfirm.textContent;
    this.modalBT = new bootstrap.Modal(this.modal, { keyboard: false });
    this.element = this.modal.querySelector(".confirm-message");

    this.btnConfirm.addEventListener("click", async (e) => {
      let originalText = this.btnConfirm.textContent;
      this.loading(true, originalText);
      this.config.success(e);
    });
  }

  /**
   * thực hiện việc loading ở button khi được click
   * @param {boolean[false]} type xác định xem có thực hiện loadding hay không. Mặc định là không loadding
   */
  loading(type = false) {
    btnLoading(this.btnConfirm, type, this.originalText);
  }

  // Thực hiện ẩn confirm
  hide() {
    this.modalBT.hide();
  }

  // Thực hiện hiển thị confirm
  show() {
    this.btnConfirm.style.backgroundColor = this.config.btnBg;
    this.element.textContent = this.config.text;
    this.btnConfirm.textContent = this.config.btnText;
    this.btnConfirm.setAttribute("title", this.config.title);

    this.modalBT.show();
  }
}

// Class thao tác với việc xử lý file
class FileHelpers {

  async downloadFile(api, name, params, getParams, fileType = "xlsx") {
    const mergedParams = { ...getParams || {}, ...params };
    try {
      const res = await axios.get(api, { responseType: "blob", params: mergedParams });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${name}.${fileType}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      showErrorMD(`Không đủ dữ liệu để xuất file ${name}.${fileType}`);
    }
  }

  exportFile(dom = "", api, name, params = {}, getParams = null, fileType = "xlsx") {
    const exportElement = dom ? document.querySelector(dom) : null;
    const handleClick = async () => {
      getParams = getParams !== null ?  getParams() : {};
      const finalParams = { ...getParams, ...params };
      if (finalParams.page) {
        api = formatApiUrl(api, finalParams);
      }
      if (exportElement) {
        const originalText = exportElement.innerHTML.trim();
        btnLoading(exportElement, true);
        await this.downloadFile(api, name, finalParams, getParams, fileType);
        btnLoading(exportElement, false, originalText);
      } else {
        await this.downloadFile(api, name, finalParams, getParams, fileType);
      }
    };

    if (exportElement) {
      if (!check(exportElement, dom)) return;
      exportElement.addEventListener("click", handleClick);
    } else {
      handleClick(); // Không có trình xử lý sự kiện, chỉ cần tải xuống trực tiếp
    }
  }

  /**Hàm có tác dụng xuất file excel
 * @param api api xuất file
 * @param name tên file file
 * @param dom nhận id class để lắng nghe sự kiện click
 */
  exportExcel(api, name, dom = "", params = {}, getParams = null) {
    this.exportFile(dom, api, name, params, getParams, "xlsx");
  }

  /**Hàm có tác dụng xuất file pdf
 * @param api api xuất file
 * @param name tên file file
 * @param dom nhận id class để lắng nghe sự kiện click
 */
  exportPDF(api, name, dom = "", params = {}, getParams = null) {
    this.exportFile(dom, api, name, params, getParams, "pdf");
  }

}

export { RequestServerHelpers, URLHelpers, ConfirmHelpers, EventHelpers, FileHelpers }