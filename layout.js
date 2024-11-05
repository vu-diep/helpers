import { RequestServerHelpers, URLHelpers } from "./core.js";
import { checkOutput } from "./common.js";
import { check, formatApiUrl, numberFormatHelpers } from "./coreFunctions.js";

/**Class có tác dụng phân trang
 * @param {object} data object trả về từ backend có chứa phân trang
 * @param {function} getUI function gọi ra giao diện
 * @param {string} pagination Id thẻ html nơi đổ dữ liệu phân trang
 */
class Pagination extends URLHelpers {
    constructor(data, getUI, pagination, api) {
        super();
        this.getUI = getUI;
        this.api = api;
        this.pagination = document.querySelector(pagination);
        if (!check(pagination, this.pagination)) return;
        this.initializeEvents();
        this.setPaginations(data);
    }
    // Hàm để khởi tạo sự kiện phân trang
    initializeEvents() {
        this.pagination.addEventListener("click", (e) => {
            // Kiểm tra nếu phần tử click có class 'btn-paginations'
            if (e.target.classList.contains("btn-paginations")) {
                e.preventDefault();
                const clickedElement = e.target;
                const page = clickedElement.getAttribute("data-page");
                this.handlePaginationClick(clickedElement, page);
            }
        });
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
        this.getData();
        btnLoading(page, false, page.textContent);
    }
    setPaginations(data) {
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
        this.pagination.innerHTML = htmlPaginations;
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
}
class BaseLayout extends URLHelpers {
    constructor(api, template, total) {
        super();
        this.api = api;
        if (!this.api) {
            console.error("Api không hợp lệ: " + this.api);
            return;
        }
        this.template = template;
        this.total = total;

        this.type = "get";
        this.tbody = "#list-data";
        const tbody = document.querySelector(this.tbody);
        if (!check(tbody, this.tbody)) return;
        this.tbody = tbody;
        this.statusHeader = true;
        this.pagination = "#paginations";
        this.request = new RequestServerHelpers(this.api);
        this.subHtml = [];
        this.colspan = 14;
        this.defaultParams = "";

        this.setColspan();
        this.getDefaultParam();
    }

    /**Hàm có tác dụng lấy ra params mặc định */
    getDefaultParam() {
        if (this.defaultParams !== "") {
            if (this.defaultParams.indexOf("function")) {
                this.defaultParams = this.defaultParams();
            }
            console.log(this.defaultParams);
            this.addParamsToURL(this.defaultParams);
        }
    }

    /**Hàm có tác dụng đếm số lượng của thẻ th rồi lưu vào colspan */
    setColspan() {
        const tableElement = this.tbody.closest("table");
        const thead = tableElement.querySelector("thead");
        const thElements = thead.querySelectorAll("th");
        const numberOfThElements = thElements.length;
        this.colspan = numberOfThElements;
    }

    /**Hàm có tác dụng thực hiện loadding khi api chưa trả về dữ liệu*/
    setLoading() {
        let loadding = `
            <tr class="loading-data">
                <td class="text-center" colspan="${this.colspan}">
                    <div class="spinner-border text-info spinner-border-sm" role="status"><span
                            class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
        this.tbody.innerHTML = loadding;
    }
}
class LayoutHelpers extends BaseLayout {
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
    constructor(api, template, total = true) {
        super(api, template, total);
        this.dataUI();
    }

    /**Hàm có tác dụng đổ dữ liệu ra giao diện */
    async dataUI() {
        this.setLoading();
        let params = this.getParams();
        if (Object.keys(params).length > 0) {
            this.api = this.removeAllParams(this.api);
            this.api = formatApiUrl(this.api, params);
        } else {
            this.api = this.removeAllParams(this.api);
        }
        let data = await this.getData();
        this.insertHTMLInTable(data, data.data.length > 0 ? 1 : 0);
    }

    /**Hàm có tác dụng gọi api
     */
    async getData() {
        // Nếu this.api không phải là mảng
        const res = await this.request.getData(this.api);
        // Cập nhật nội dung cho DOM nếu this.total là một mảng
        if (Array.isArray(this.total)) {
            this.total.forEach((item) => {
                const element = document.getElementById(item.dom);
                if (element) {
                    let value = res[item.key];
                    if (item.format && item.format === "date") {
                        value = dateTimeFormat(value);
                    } else if (item.format === "number") {
                        value = numberFormatHelpers(value);
                    }
                    element.innerText = `${value} ${item.subContent || ""}`.trim();
                }
            });
        } else if (this.total === true) {
            // Trường hợp this.total là true, cập nhật tổng số
            const totalElement = document.getElementById("total");
            if (!check(totalElement, "total")) return;

            totalElement.innerText = `${res.total}`;
        }

        // Trả về dữ liệu
        return res;
    }

    /**Hàm có tác dụng đổ ra dữ liệu
     * @param data dữ liệu cần hiển thị
     * @param {boolean}  status phân biệt giữa hiển thị không có dữ liệu và có dữ liệu
     */
    insertHTMLInTable(data, stauts = 0) {

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
                            const [col1, col2] = sub.column.split("*").map((col) => col.trim());
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
                let footerRow = `<tr>`; // Tạo một hàng (tr) duy nhất

                this.subHtml.forEach((item) => {
                    // Chèn tất cả các cột (td) vào cùng một hàng
                    footerRow += item.html.replace("{total}", numberFormatHelpers(checkOutput(totals[item.column], 0)));
                });

                footerRow += `</tr>`; // Kết thúc hàng
                html += footerRow; // Gộp tất cả các cột vào trong một hàng
            }
        }
        // kiểm tra xem có thực hiện phân trang hay không
        if (this.pagination) {
            new Pagination(data, this.dataUI.bind(this), this.pagination, this.api);
        }
        this.tbody.innerHTML = html;
        this.setLabel();
    }
    setLabel() {
        let tableElement = this.tbody.closest('table');
        if (tableElement) {
            tableElement.classList.add('table-config');
            let headers = tableElement.querySelectorAll('thead th');
            let rows = tableElement.querySelectorAll('tbody tr');
            rows.forEach(function (row) {
                if (!row.classList.contains('none-data')) {
                    let cells = row.querySelectorAll('td');
                    cells.forEach(function (cell, index) {
                        let label = headers[index]?.textContent.trim();
                        label = label?.toUpperCase();
                        cell.setAttribute('data-label', label);
                    });
                }
            });
        }
    }
    /**hàm có tác dụng lắng nghe sự kiện click của 1 thẻ nào đó. Sau đó thực hiện 1 công việc bất kỳ. Thường dùng cho edit hoặc delete 
     * @param {string} className của thẻ cần lắng nghe sự kiện click
     * @param {callback} callback(id, e) là một hàm bất kỳ có tác dụng thực hiện sau khi click
     * id: là id của thẻ bạn vừa click thông thường tôi sẽ đưa id của sản phẩm vào id thẻ
     * e: bản thân cái thẻ vừa được click
     * VD:
     * layout.handleEventClick("btn-click", async(id, e) => {
          console.log(id);
          console.log(e);
      })
     */
    handleEventClick(className, callback) {
        this.tbody.addEventListener("click", function (e) {
            // Kiểm tra xem phần tử được click hoặc thẻ cha của nó có chứa class không
            const targetElement = e.target.closest(`.${className}`);
            if (targetElement) {
                let id = targetElement.id;
                callback(id, e);
            }
        });
    }
}

export { LayoutHelpers, BaseLayout, Pagination }