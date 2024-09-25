import { checkOutput, removeCommasHelpers } from "./common.js";
import { formatApiUrl, convertDateFormatHelpers, formatAPI, check, formatDataResponse, clearAllClassValidateHelpers} from "./coreFunctions.js";
// xác định message trả về
const messageError = "error";
const messageSussces = "success";

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

// Class thao tác với việc xử lý file
class FileHelpers{
  /**Hàm có tác dụng xuất file excel
   * @param api api xuất file
   * @param name tên file file
   * @param dom nhận id class để lắng nghe sự kiện click
   */
  exportExcel(api, name, dom = "") {
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
     *  {dom: id thẻ nhận dữ liệu, key: key khi trả về từ api, subContent: Nội dung phụ đằng sau, format: "date" or "number"}
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
    this.insertHTMLInTable(data.data, data.status === 200 ? 1: 0);
  }

  /**Hàm có tác dụng gọi api
   */
  async getUI() {
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
              if(!check(totalElement, "total")) return;
              totalElement.innerText = `${res.total} sản phẩm`;
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
    const res = await this.request.getData();
    // Cập nhật nội dung cho DOM nếu this.total là một mảng
    if (Array.isArray(this.total)) {
      this.total.forEach((item) => {
        const element = document.getElementById(item.dom);
        if (element) {
          let  value = res.data[item.key];
          if(item.format && item.format === "date"){
              value = dateTimeFormat(value);
          }else if(item.format === "number"){
            value = formatNumber(value);
          }
          element.innerText = `${value} ${item.subContent || ""}`.trim();
        }
      });
    } else if (this.total === true) {
      // Trường hợp this.total là true, cập nhật tổng số
      const totalElement = document.getElementById("total");
      if(!check(totalElement, "total")) return;
      totalElement.innerText = `${res.data.total}`;
    }

    // Trả về dữ liệu
    return res.data;
  }

  /**Hàm có tác dụng đổ ra dữ liệu
   * @param data dữ liệu cần hiển thị
   * @param {boolean}  status phân biệt giữa hiển thị không có dữ liệu và có dữ liệu
   */
  insertHTMLInTable(data, stauts = 0) {
    const domForm = document.querySelector(this.form);
    if (!check(domForm, this.form)) return;
    this.form = domForm;

    // đếm thẻ th để thực hiện colspan khi có lỗi
    const tableElement = domForm.closest("table");
    const thead = tableElement.querySelector("thead");
    const thElements = thead.querySelectorAll("th");
    const numberOfThElements = thElements.length;
    this.colspan = numberOfThElements;

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
                        ${checkOutput(data.from, 0)} đến ${checkOutput(data.to, 0)}
                        <span class="text-body-tertiary"> Trong </span> ${checkOutput(data.total, 0)}
                    </p>
                    <a class="btn-link" id = "btn-show-all" href="javascript:" title="Tất cả" ${data.all ? "hidden" : ""}> Tất cả
                        <span class="fas fa-angle-right ms-1"></span>
                    </a>
                    <a class="btn-link" id="btn-collapse" href="javascript:" title="Thu gọn" ${data.all ? "" : "hidden"}> Thu gọn<span class="fas fa-angle-left ms-1"></span>
                    </a>
                </div>
                    <nav class="col-auto d-flex">
                        <ul class="mb-0 pagination justify-content-end">
                            <li class="page-item ${data.currentPage <= 1 ? "disabled" : ""}">
                                <a class="page-link ${data.currentPage <= 1 ? "disabled" : ""}" id="btn-before" ${data.currentPage <= 1 ? 'disabled=""' : ""} href="javascript:" title="Trang trước" >
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

  /**hàm có tác dụng lắng nghe sự kiện click của 1 thẻ nào đó. Sau đó thực hiện 1 công việc bất kỳ. Thường dùng cho edit hoặc delete 
   * @param {string} className của thẻ cần lắng nghe sự kiện click
   * @param {callback} callback là một hàm bất kỳ có tác dụng thực hiện sau khi click
   */
  handleEventClick(className, callback){
    this.form.querySelectorAll(className).forEach(button => {
      button.addEventListener('click', (e) => {
        // Thực hiện 1 công việc bất kì
        callback(e);
      })
    })
  }
}

export { RequestServerHelpers, URLHelpers, ConfirmHelpers, LayoutHelpers, EventHelpers, FileHelpers }