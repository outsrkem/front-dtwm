/*
 * 与后台交互模块 （依赖已封装的ajax函数）
 * 包含n个接口请求函数的模块，函数的返回值是promise对象
 */
import ajax from "../api/ajax";
/**
 * ajax 有如下4个参数
 * @param {*} url 请求路径，默认为空
 * @param {*} method 请求方法，默认为GET
 * @param {*} params 请求参数，默认为空对象
 * @param {*} data 请求参数，默认为空对象
 */

const baseURL = "/api/dtwm";

export const Resume = () => ajax(`${baseURL}/v1/resume`, "POST");

// 查询仓库
export const GetWarehouses = (params) => ajax(`${baseURL}/dtwm/warehouses`, "GET", params, null);
// 新建仓库
export const CreateWarehouses = (data) => ajax(`${baseURL}/dtwm/warehouses`, "POST", null, data);
// 删除仓库
export const DeleteWarehouses = (paths) => ajax(`${baseURL}/dtwm/warehouses/${paths.id}`, "DELETE", null, null);

// 库存信息

// 出入库明细
export const GetParticulars = (params) => ajax(`${baseURL}/v1/particulars`, "GET", params, null);

// 查询单据
export const Getstockorder = (params) => ajax(`${baseURL}/v1/stockorder`, "GET", params, null);

// h.POST("/v1/items", item.CreateItem())      // 创建物品 √
// h.POST("/v1/shelves/on", item.UpItem())     // 上架物品 √
// h.POST("/v1/shelves/off", item.DownItem())  // 下架物品 √
// h.GET("/v1/items", item.ListItem())         // 查询物品(支持搜索) √
// h.DELETE("/v1/item/:id", item.DeleteItem()) // 删除物品
// h.PUT("/v1/item/:id", item.UpdateItem())    // 更新物品 √
export const AddItems = (data) => ajax(`${baseURL}/v1/items`, "POST", null, data);
export const UpItems = (data) => ajax(`${baseURL}/v1/shelves/on`, "POST", null, data);
export const DownItems = (data) => ajax(`${baseURL}/v1/shelves/off`, "POST", null, data);
export const GetItems = (params) => ajax(`${baseURL}/v1/items`, "GET", params, null);
export const UpdateItem = (paths, data) => ajax(`${baseURL}/v1/item/${paths.id}`, "PUT", null, data);

// 查询进出库类型
// 入库操作 /v1/stock/in
// 流程审批 /v1/electronic-flow/review
// 查询出入库单据详情 GET /v1/stock/order/:order_id

// h.POST("/v1/stock/in", inventory.ItemInWarehouseV1()); // 入库操作 √
// h.POST("/v1/stock/out", inventory.ItemOutWarehouseV1()); // 出库操作 √
// h.POST("/v1/electronic-flow/review", flow.ReviewFlow()); // 审理电子流 √
// h.GET("/v1/stockorder", stockorder.SelectStockOrder()); // 查询单据列表 √
// h.GET("/v1/stock/order/:orderId", stockorder.SelectOrderDetails()); // 查询出入库单据详情 √
// h.GET("/v1/particulars", particulars.OutInParticulars()); // 出入库明细 √
// h.GET("/v1/inventory", inventory.SelectInventory()); // 查询物品库存 √
// h.GET("/v1/classification", classification.SelectClassification()); // 查询进出库类型 √
export const InStock = (data) => ajax(`${baseURL}/v1/stock/in`, "POST", null, data);
export const ItemOutWarehouse = (data) => ajax(`${baseURL}/v1/stock/out`, "POST", null, data);
export const GetClassification = (params) => ajax(`${baseURL}/v1/classification`, "GET", params, null);
export const ReviewFlow = (data) => ajax(`${baseURL}/v1/electronic-flow/review`, "POST", null, data);
export const GetOrderDetails = (paths) => ajax(`${baseURL}/v1/stock/order/${paths.order_id}`, "GET", null, null);
export const SelectInventory = (params) => ajax(`${baseURL}/v1/inventory`, "GET", params, null);
export const SelectStockOrder = (params) => ajax(`${baseURL}//v1/stockorder`, "GET", params, null);

// h.POST("/v1/supplier", supplier.CreateSupplier())               // 创建供应商 √
// h.GET("/v1/supplier/:id", supplier.GetSupplierByID())           // 根据ID获取供应商详情 √
// h.GET("/v1/supplier/code/:code", supplier.GetSupplierByCode())  // 根据编码获取供应商详情 √
// h.GET("/v1/supplier/list", supplier.ListSuppliers())            // 分页查询供应商列表 √
// h.POST("/v1/supplier/batch", supplier.BatchGetSuppliers())      // 批量获取供应商(根据ID列表) √
// h.PUT("/v1/supplier/:id", supplier.UpdateSupplier())            // 更新供应商信息 √
// h.DELETE("/v1/supplier/:id", supplier.DeleteSupplier())         // 删除供应商 √
// h.PATCH("/v1/supplier/:id/disable", supplier.DisableSupplier()) // 禁用供应商 √
// h.PATCH("/v1/supplier/:id/enable", supplier.EnableSupplier())   // 启用供应商 √
export const CreateSupplier = (data) => ajax(`${baseURL}/v1/supplier`, "POST", null, data);
export const GetSupplierByID = (paths) => ajax(`${baseURL}/v1/supplier/${paths.id}`, "GET", null, null);
export const GetSupplierByCode = (paths) => ajax(`${baseURL}/v1/supplier/code/${paths.code}`, "GET", null, null);
export const ListSuppliers = (params) => ajax(`${baseURL}/v1/supplier/list`, "GET", params, null);
export const BatchGetSuppliers = (data) => ajax(`${baseURL}/v1/supplier/batch`, "POST", null, data);
export const UpdateSupplier = (paths, data) => ajax(`${baseURL}/v1/supplier/${paths.id}`, "PUT", null, data);
export const DeleteSupplier = (paths) => ajax(`${baseURL}/v1/supplier/${paths.id}`, "DELETE", null, null);
export const DisableSupplier = (paths) => ajax(`${baseURL}/v1/supplier/${paths.id}/disable`, "PATCH", null, null);
export const EnableSupplier = (paths) => ajax(`${baseURL}/v1/supplier/${paths.id}/enable`, "PATCH", null, null);

// h.GET("/v1/overview/stock", apc("dtwm:overview:listPreview"), overview.StockEarly()) // 数据统计
export const StockEarly = (params) => ajax(`${baseURL}/v1/overview/stock`, "GET", params, null);

// h.GET("/v1/user", apc("dtwm:user:list"), core.ListUser()); // 获取用户列表,搜索用户
// h.GET("/v1/checkpoint/control/:warehouseId", pointctl.ListPermission());
// h.POST("/v1/checkpoint/control/:warehouseId", pointctl.AddPermission());
// h.DELETE("/v1/checkpoint/control/:warehouseId", pointctl.DeletePermission());

export const ListUser = (params) => ajax(`${baseURL}/v1/user`, "GET", params, null);
export const ListPermission = (paths) => ajax(`${baseURL}/v1/checkpoint/control/${paths.warehouse_id}`, "GET", null, null);
export const AddPermission = (paths, data) => ajax(`${baseURL}/v1/checkpoint/control/${paths.warehouse_id}`, "POST", null, data);
export const DeletePermission = (paths, data) => ajax(`${baseURL}/v1/checkpoint/control/${paths.warehouse_id}`, "DELETE", null, data);
