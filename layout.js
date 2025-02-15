import { RequestServerHelpers, URLHelpers } from "./core.js";
import { checkOutput } from "./common.js";
import { ChoiceHelpers } from "./form.js";
import { check, formatApiUrl, numberFormatHelpers } from "./coreFunctions.js";

/**Class có tác dụng phân trang
 * @param {object} data object trả về từ backend có chứa phân trang
 * @param {function} renderUI function gọi ra giao diện
 * @param {string} pagination Id thẻ html nơi đổ dữ liệu phân trang
 */
class PaginationHelpers extends URLHelpers {
    constructor(data, renderUI, pagination, event) {
        super();
        this.renderUI = renderUI;
        this.eventInitialized = event;
        this.pagination = document.querySelector(pagination);
        if (!check(pagination, this.pagination)) return;
        this.initializeEvents();
        this.setPaginations(data);
    }
    // Hàm để khởi tạo sự kiện phân trang
    initializeEvents() {
        if (this.eventInitialized) return;
        this.pagination.addEventListener("click", (e) => {
            // Kiểm tra nếu phần tử click có class 'btn-paginations'
            if (e.target.classList.contains("btn-paginations")) {
                e.preventDefault();
                const clickedElement = e.target;
                const page = clickedElement.getAttribute("data-page");
                this.handlePaginationClick(clickedElement, page);
            }
        });
        this.eventInitialized = true; // Đánh dấu là sự kiện đã được đăng ký
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
        this.renderUI();
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
                  
                      <nav class="col-auto d-${data.all ? "none" : "flex"}">
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

class BaseLayoutHelpers extends URLHelpers {
    constructor(api, template, total, defaultParams = "") {
        super();
        this.api = api;
        if (!this.api) {
            console.error("Api không hợp lệ: " + this.api);
            return;
        }
        this.template = template;
        this.total = total;

        this.tbody = "#list-data";
        const tbody = document.querySelector(this.tbody);
        if (!check(tbody, this.tbody)) return;
        this.tbody = tbody;
        this.choice = new ChoiceHelpers(this.tbody);
        this.statusHeader = true;
        this.pagination = "#paginations";
        this.request = new RequestServerHelpers(this.api);
        this.subHtml = [];
        this.colspan = 14;
        this.defaultParams = defaultParams;
        this.index = 0;
        this.callback = "";
        this.eventInitialized = false;
        this.setColspan();
        if (this.defaultParams !== "") this.getDefaultParam();
    }

    async renderUI() {
        let params = this.getParams();
        this.request.params = params;
        let response = await this.request.getData(this.api);
        this.insertHTMLInTable(response);

        if (typeof this.callback == "function") {
            this.callback(response);
        }
    }


    insertHTMLInTable(response) {
        this.index = response.from;
        const html = this.template(response, this.index);
        // kiểm tra xem có thực hiện phân trang hay không
        if (this.pagination) {
            new PaginationHelpers(response, this.renderUI.bind(this), this.pagination, this.eventInitialized);
            this.eventInitialized = true;
        }
        this.tbody.innerHTML = html;
        this.setLabelAndTitle();
    }

    /**Hàm có tác dụng lấy ra params mặc định */
    getDefaultParam() {
        let defaultParams = this.defaultParams;
        if (typeof this.defaultParams == "function") {
            defaultParams = this.defaultParams();
        }
        this.addParamsToURL(defaultParams);
        return defaultParams;
    }

    /**Hàm có tác dụng đếm số lượng của thẻ th rồi lưu vào colspan */
    setColspan() {
        const tableElement = this.tbody.closest("table");
        if (tableElement) {
            const thead = tableElement.querySelector("thead");
            const thElements = thead.querySelectorAll("th");
            const numberOfThElements = thElements.length;
            this.colspan = numberOfThElements;
        }
    }

    /**Hàm có tác dụng thực hiện loadding khi api chưa trả về dữ liệu*/
    setLoading() {
        let tableElement = this.tbody.closest('table');
        let loadding = `
            <tr class="loading-data">
                <td class="text-center" colspan="${this.colspan}">
                    <div class="spinner-border text-info spinner-border-sm" role="status"><span
                            class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
        if (!tableElement) {
            loadding = `
                <div class="text-center">
                    <div class="spinner-border text-info spinner-border-sm" role="status"><span
                            class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
        this.tbody.innerHTML = loadding;
    }

    // hàm có tác dụng setAttribute vào tbody. Với dữ liệu được lấy từ thead
    setAttribute(attributes) {
        let tableElement = this.tbody.closest('table');
        if (tableElement) {
            let headers = tableElement.querySelectorAll('thead th');
            let rows = tableElement.querySelectorAll('tbody tr');

            rows.forEach(function (row) {
                let cells = row.querySelectorAll('td');
                let headerIndex = 0; // Dùng để theo dõi vị trí của tiêu đề

                cells.forEach(function (cell) {
                    if (!cell.classList.contains('none-data')) {
                        const colspan = parseInt(cell.getAttribute("colspan")) || 1;

                        // Lấy tiêu đề tương ứng từ `headers`
                        let label = headers[headerIndex]?.textContent.trim();
                        if (label) {
                            label = label?.toUpperCase();

                            // Set thuộc tính
                            if (Array.isArray(attributes)) {
                                attributes.forEach(attribute => {
                                    cell.setAttribute(attribute, label);
                                });
                            } else {
                                cell.setAttribute(attributes, label);
                            }

                            // Tăng headerIndex dựa trên colspan
                            headerIndex += colspan;
                        }
                    } else {
                        headerIndex++;
                    }
                });
            });
        }
    }

    // Hàm có tác dụng sét data lable và title cho thẻ td dựa theo thẻ th mục đích khi về màn hình mobile có thể hiển thị được
    setLabelAndTitle() {
        let tableElement = this.tbody.closest('table');
        let attributes = ['title'];
        if (tableElement && tableElement.classList.contains('table-config')) {
            attributes.push('data-label');
        }
        this.setAttribute(attributes);

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
        this.tbody.addEventListener("click", async function (e) {
            // Kiểm tra xem phần tử được click hoặc thẻ cha của nó có chứa class không
            const targetElement = e.target.closest(`.${className}`);
            if (targetElement) {
                const btnClick = e.target;
                const originalText = btnClick.innerHTML;
                btnLoading(btnClick, true);
                let id = targetElement.id;
                await callback(id, e);
                btnLoading(btnClick, false, originalText);
            }
        });
    }

    /**Hàm có tác dụng lấy vị trí hiện tại của thanh cuộn và lưu vào localStorage */
    saveScrollPosition() {
        sessionStorage.setItem('scrollPosition', JSON.stringify({
            x: window.scrollX,
            y: window.scrollY
        }));
    }

    /**Hàm có tác dụng cuộn chột đến vị trí đã lưu trong  localStorage*/
    restoreScrollPosition() {
        const restorePosition = JSON.parse(sessionStorage.getItem('scrollPosition'));;
        if (restorePosition !== null) {
            setTimeout(() => {
                window.scrollTo({
                    left: restorePosition.x,
                    top: restorePosition.y,
                    behavior: "smooth"
                });
            }, 500)
        }
    }

}

class LayoutHelpers extends BaseLayoutHelpers {
    /**
       * @constructor 
       * @param {string, Array} api thực hiện gọi api, Nếu bạn có nhiều api thì hãy truyền dạng mảng. Dữ liệu sau khi trả về sẽ được gom lại thành 1 mảng chứa các object bên trong. Đối với api đầu tiên sẽ là api chính tức là: phân trang, lọc sẽ chỉ hoạt động ở api đầu tiên
       * @param {Callback} template là một callback trả về html dựa theo mảng data truyền vào
       * @param {boolean, Array} total phân biệt có hiển thị tính tổng số lượng hay không
       * @param {HTMLFormElement} form nơi đổ ra dữ liệu cần hiển thị
       * @param {number} colspan số cột cần gộp nếu có lỗi
       * [
       *  {dom: id thẻ nhận dữ liệu, key: key khi trả về từ api, subContent: Nội dung phụ đằng sau, format: "date" or "number"}
       * ]
       * @param {boolean} [statusHeader = true] là trạng thái hiển thị xem có index tự tăng ở đầu hay không. Nếu là false thì không hiển thị
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
    constructor(api, template, total = true, defaultParams = "") {
        super(api, template, total, defaultParams);
        this.renderUI();
    }

    /**Hàm có tác dụng gọi api
     */
    async renderUI() {
        // this.setLoading();
        let params = this.getParams();
        if (Object.keys(params).length > 0) {
            this.api = this.removeAllParams(this.api);
            this.api = formatApiUrl(this.api, params);
        } else {
            this.api = this.removeAllParams(this.api);
        }
        const res = await this.request.getData(this.api);
        // Cập nhật nội dung cho DOM nếu this.total là một mảng
        if (Array.isArray(this.total)) {
            this.total.forEach((item) => {
                const element = document.getElementById(item.dom);
                if (!element) {
                    console.error(`Không tìm thấy dom với id ${item.dom}`);
                } else {
                    let value = checkOutput(res[item.key], 0);
                    if (item.format && item.format === "date") {
                        value = dateTimeFormat(value ?? 0);
                    } else if (item.format === "number") {
                        value = numberFormatHelpers(value ?? 0);
                    }
                    element.innerText = `${value} ${item.subContent || ""}`.trim();
                }
            });
        } else if (this.total === true) {
            // Trường hợp this.total là true, cập nhật tổng số
            const totalElement = document.getElementById("total");
            if (!check(totalElement, "total")) return;

            totalElement.innerText = res.total;
        }

        this.insertHTMLInTable(res);
        if (typeof this.callback == "function") {
            this.callback(response);
        }
    }

    /**Hàm có tác dụng đổ ra dữ liệu
     * @param data dữ liệu cần hiển thị
     * @param {boolean}  status phân biệt giữa hiển thị không có dữ liệu và có dữ liệu
     */
    insertHTMLInTable(res) {
        var data = res.data;
        let html = "";
        if (data && data.length === 0) {
            html += `
                  <tr class="loading-data">
                      <td class="text-center" colspan="${this.colspan}">
                          <span class="text-danger">Không có dữ liệu</span>
                      </td>
                  </tr>
              `;
        } else {
            if (!data || data.from === "undefined") {
                console.error("api đang bị lỗi hoặc bạn k không sử dụng class phân trang ở backend");
                return;
            }
            let totals = {};

            if (this.subHtml.length > 0) {
                // Khởi tạo tổng cho các cột trong subHtml
                this.subHtml.forEach((sub) => {
                    totals[sub.column] = 0;
                });
            }
            // Chuyển đổi 'data' thành một mảng các object
            data = Object.values(data);

            data.forEach((item, index) => {
                let row = `<tr>`;
                if (this.statusHeader) {
                    row += `<td class="phase align-middle white-space-nowrap text-center">${index + 1}</td>`;
                }
                row += this.template(item, index); // Truyền 'item' vào hàm htmlTemplates
                row += `</tr>`;
                html += row;

                if (this.subHtml.length > 0) {
                    this.subHtml.forEach((sub) => {
                        if (sub.column.includes("*")) {
                            const [col1, col2] = sub.column.split("*").map((col) => col.trim());
                            if (item[col1] !== undefined && item[col2] !== undefined) {
                                totals[sub.column] += Number(item[col1]) * Number(item[col2]);
                            }
                        }
                        else if (item[sub.column] !== undefined) {
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
            new PaginationHelpers(res, this.renderUI.bind(this), this.pagination, this.eventInitialized);
            this.eventInitialized = true;
        }
        this.tbody.innerHTML = html;
        this.setLabelAndTitle();
        // this.restoreScrollPosition();
    }
}

export { LayoutHelpers, BaseLayoutHelpers, PaginationHelpers }