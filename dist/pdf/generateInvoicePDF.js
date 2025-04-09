"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const number_to_words_1 = require("number-to-words");
const generateInvoicePDF = (invoice, settings) => __awaiter(void 0, void 0, void 0, function* () {
    const templatePath = path_1.default.join(__dirname, 'invoice-template.hbs');
    const htmlContent = yield promises_1.default.readFile(templatePath, 'utf8');
    const template = handlebars_1.default.compile(htmlContent);
    const data = {
        invoice: Object.assign(Object.assign({}, invoice), { date: new Date(invoice.createdAt).toLocaleDateString(), deliveryDate: invoice.deliveryDate
                ? new Date(invoice.deliveryDate).toLocaleDateString()
                : null, cgst: (invoice.totalTax / 2).toFixed(2), sgst: (invoice.totalTax / 2).toFixed(2), amountInWords: (0, number_to_words_1.toWords)(invoice.totalPrice) }),
        settings,
    };
    const compiledHtml = template(data);
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield page.setContent(compiledHtml, { waitUntil: 'networkidle0' });
    const pdf = yield page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
    });
    yield browser.close();
    return Buffer.from(pdf);
});
exports.generateInvoicePDF = generateInvoicePDF;
//# sourceMappingURL=generateInvoicePDF.js.map