"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 5000;
try {
    app_1.default.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}
catch (err) {
    console.error("Server failed to start:", err);
}
//# sourceMappingURL=server.js.map