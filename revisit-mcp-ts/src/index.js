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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var path_1 = require("path");
var utils_1 = require("./utils");
var server = new mcp_js_1.McpServer({
    name: "RevisitMCP",
    description: "This server provide shemas, templates, examples and funcitons to build empirical study using revisit DSL",
    version: "1.0.0",
});
server.registerTool("getversion", {
    title: "Get Revisit Version",
    description: "Get the version of Revisit framework",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: "Revisit Framework Version: 2.0.0"
                    }]
            }];
    });
}); });
server.registerTool("getcitation", {
    title: "Get Revisit Citation",
    description: "Get the BibTeX citation for Revisit framework",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: "@INPROCEEDINGS{revisit,\n  author={Ding, Yiren and Wilburn, Jack and Shrestha, Hilson and Ndlovu, Akim and Gadhave, Kiran and Nobre, Carolina and Lex, Alexander and Harrison, Lane},\n  booktitle={2023 IEEE Visualization and Visual Analytics (VIS)},\n  title={reVISit: Supporting Scalable Evaluation of Interactive Visualizations},\n  year={2023},\n  volume={},\n  number={},\n  pages={31-35},\n  keywords={Training;Costs;Visual analytics;Data visualization;Data collection;Market research;Task analysis;Human-centered computing;Software prototype;Visualization systems and tools;Empirical Study},\n  doi={10.1109/VIS54172.2023.00015}}"
                    }]
            }];
    });
}); });
server.registerTool("getconfigschema", {
    title: "Get Config Schema",
    description: "Get the path to Revisit config file schema",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: "src/parser/StudyConfigSchema.json"
                    }]
            }];
    });
}); });
server.registerTool("gettypes", {
    title: "Get Types Definition",
    description: "Get the path to Revisit types definition file",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: "src/parser/types.ts"
                    }]
            }];
    });
}); });
server.registerTool("getstudytemplatemetadata", {
    title: "Get Study Template Metadata",
    description: "Get metadata for all available study templates",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    var templateData, responseTypesInfo;
    return __generator(this, function (_a) {
        templateData = [
            {
                "path": "public/demo-click-accuracy-test",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/demo-dynamic",
                "stimuli": ["react-component"],
                "sequence": ["dynamic"],
                "basecomponent": false,
                "response": ["buttons"],
                "features": []
            },
            {
                "path": "public/demo-html",
                "stimuli": ["website"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["numerical"],
                "features": []
            },
            {
                "path": "public/demo-html-input",
                "stimuli": ["website"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/demo-html-trrack",
                "stimuli": ["website"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-image",
                "stimuli": ["image"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["radio", "shortText"],
                "features": []
            },
            {
                "path": "public/demo-reaction-speed",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/demo-screen-recording",
                "stimuli": ["website"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["numerical"],
                "features": ["screen-recording", "audio-recording"]
            },
            {
                "path": "public/demo-style",
                "stimuli": ["markdown", "react-component", "image", "website", "vega", "video"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["textOnly", "shortText", "numerical", "longText", "likert", "matrix-radio", "buttons"],
                "features": ["styling", "external-stylesheets", "matrix-responses", "text-only-responses", "buttons-responses"]
            },
            {
                "path": "public/demo-survey",
                "stimuli": ["markdown"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["text", "radio", "checkbox"],
                "features": []
            },
            {
                "path": "public/demo-temperature-study",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-training",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-upset",
                "stimuli": ["vega"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-vega",
                "stimuli": ["vega"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-video",
                "stimuli": ["video"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/demo-video-slider",
                "stimuli": ["video"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["slider"],
                "features": []
            },
            {
                "path": "public/demo-yaml",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/example-brush-interactions",
                "stimuli": ["vega"],
                "sequence": ["fixed", "random"],
                "basecomponent": true,
                "response": [],
                "features": []
            },
            {
                "path": "public/example-cleveland",
                "stimuli": ["vega"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/example-mvnv",
                "stimuli": ["html"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/example-VLAT-full_fixed",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/example-VLAT-full-randomized",
                "stimuli": ["react-component"],
                "sequence": ["fixed", "random"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/example-VLAT-mini-randomized",
                "stimuli": ["react-component"],
                "sequence": ["fixed", "random"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": []
            },
            {
                "path": "public/html-stimuli/mvnv-study",
                "stimuli": ["html"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/library-beauvis",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": [],
                "features": [],
                "library": "beauvis"
            },
            {
                "path": "public/library-calvi",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": [],
                "features": [],
                "library": "calvi"
            },
            {
                "path": "public/library-color-blindness",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": [],
                "features": [],
                "library": "color-blindness"
            },
            {
                "path": "public/library-demographics",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["text", "radio", "checkbox"],
                "features": [],
                "library": "demographics"
            },
            {
                "path": "public/library-mic-check",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["audio"],
                "features": [],
                "library": "mic-check"
            },
            {
                "path": "public/library-mini-vlat",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": [],
                "library": "mini-vlat"
            },
            {
                "path": "public/library-nasa-tlx",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["slider"],
                "features": [],
                "library": "nasa-tlx"
            },
            {
                "path": "public/library-previs",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": [],
                "features": [],
                "library": "previs"
            },
            {
                "path": "public/library-sus",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["radio"],
                "features": [],
                "library": "sus"
            },
            {
                "path": "public/library-vlat",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": ["reactive"],
                "features": [],
                "library": "vlat"
            },
            {
                "path": "public/test-audio",
                "stimuli": ["vega"],
                "sequence": ["fixed"],
                "basecomponent": true,
                "response": [],
                "features": ["audio-recording"]
            },
            {
                "path": "public/test-library",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/test-likert-matrix",
                "stimuli": ["react-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": ["likert"],
                "features": []
            },
            {
                "path": "public/test-parser-errors",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/test-randomization",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed", "latinSquare"],
                "basecomponent": false,
                "response": [],
                "features": ["latin-square", "interruptions"]
            },
            {
                "path": "public/test-skip-logic",
                "stimuli": ["markdown"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": ["skip-logic", "interruptions"]
            },
            {
                "path": "public/test-step-logic",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/test-uncert",
                "stimuli": ["generic-web-component"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            },
            {
                "path": "public/tutorial",
                "stimuli": ["markdown"],
                "sequence": ["fixed"],
                "basecomponent": false,
                "response": [],
                "features": []
            }
        ];
        responseTypesInfo = {
            "newResponseTypes": [
                "textOnly - Display-only text responses for instructions",
                "matrix-radio - Matrix-style radio button responses with rows/columns",
                "matrix-checkbox - Matrix-style checkbox responses with rows/columns",
                "buttons - Button-based responses with keyboard navigation"
            ],
            "enhancedFeatures": [
                "skip-logic - Advanced skip conditions for complex study flows",
                "interruptions - Deterministic and random breaks/attention checks",
                "dynamic-blocks - Function-based sequence generation",
                "library-system - Import and reuse components from external libraries",
                "styling - CSS styling and external stylesheet support",
                "screen-recording - Audio and screen recording capabilities",
                "audio-recording - Audio recording functionality",
                "latin-square - Latin square experimental design for balanced randomization",
                "matrix-responses - Matrix-style responses with rows and columns",
                "text-only-responses - Display-only text responses for instructions",
                "buttons-responses - Button-based responses with keyboard navigation",
                "enhanced-ui - New UI options like screen size requirements"
            ],
            "responseProperties": [
                "withDivider - Add trailing dividers to responses",
                "withDontKnow - Add 'I don't know' option to responses",
                "stylesheetPath - External stylesheet support",
                "style - Inline CSS styling",
                "horizontal - Horizontal layout for radio/checkbox",
                "withOther - 'Other' option for radio/checkbox",
                "restartEnumeration - Restart question numbering"
            ]
        };
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            templates: templateData,
                            newFeatures: responseTypesInfo
                        }, null, 2)
                    }]
            }];
    });
}); });
server.registerTool("generatestudyprompt", {
    title: "Generate Study Prompt",
    description: "Generate an enhanced prompt for creating a Revisit study based on user description",
    inputSchema: {
        description: zod_1.z.string().describe("The user's study description")
    }
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var enhancedPrompt;
    var description = _b.description;
    return __generator(this, function (_c) {
        enhancedPrompt = "# \uD83C\uDFAF Task: Generate an Empirical Study using the Revisit Framework\n\nYou are tasked with generating a study configuration using the **Revisit Framework**. This involves creating a folder structure, DSL config file, and assets based on the user's description.\nCheck the study config schema first, then check a few template studies similar to the user's description based on their tags before starting to build the study.\n\n---\n\n## \uD83D\uDCE5 User's Study Description:\n".concat(description, "\n\n---\n\n## \uD83E\uDDE9 Before creating the study:\n- Call \"getconfigschema\" to get the schema file location.\n- Call \"getstudytemplatemetadata\" to retrieve existing study template metadata.\n- Be sure to read a few templates that match closely to the user's requirement as references.\n\n---\n\n## \uD83D\uDCC1 Folder Structure & Files:\n- Create a new folder under: `public/`\n- Place the following inside that folder:\n  - The generated config file (DSL format)\n  - All related assets (e.g., JSON, images, etc.)\n\n---\n\n## \uD83C\uDD95 New Response Types Available:\n- **textOnly**: Display-only text responses for instructions (cannot be required)\n- **matrix-radio**: Matrix-style radio buttons with rows/columns (requires answerOptions and questionOptions)\n- **matrix-checkbox**: Matrix-style checkboxes with rows/columns (requires answerOptions and questionOptions)\n- **buttons**: Button-based responses with keyboard navigation (requires options array)\n\n## \uD83C\uDD95 Enhanced Response Features:\n- **withDivider**: Add trailing dividers to responses\n- **withDontKnow**: Add \"I don't know\" option to responses\n- **stylesheetPath**: External stylesheet support\n- **style**: Inline CSS styling (React CSSProperties)\n- **horizontal**: Horizontal layout for radio/checkbox\n- **withOther**: \"Other\" option for radio/checkbox\n- **restartEnumeration**: Restart question numbering (for textOnly)\n\n## \uD83C\uDD95 Advanced Study Flow Features:\n- **Skip Logic**: Use skip conditions for complex study flows\n- **Interruptions**: Add deterministic or random breaks/attention checks\n- **Dynamic Blocks**: Use function-based sequence generation\n- **Library System**: Import and reuse components from external libraries\n\n## \u269B\uFE0F React Component Support:\n- If the study stimuli is a React component:\n  - Create the React component under: `src/public/`\n  - Use existing templates with react-component stimuli as reference\n  - If the response type is reactive, in config file, the id in response need to be passed to react component use parameters for each trial. So taskid in all trials should be same as in response. \n\n---\n\n## \u269B\uFE0F Important Notes:\n- You can leave author and organization fields empty in the config file.\n- You can create `basecomponent` if many components share common attributes, but **do not** put response attributes into `basecomponent`.\n- \"$schema\", \"uiconfig\", \"studymetadata\", \"components\", and \"sequence\" are required for every config file.\n- The chart generation function in chart generator MCP should return the URL of the image.\n- For matrix responses, use predefined answer options like 'satisfaction5', 'satisfaction7', 'likely5', 'likely7' or provide custom arrays.\n\n---\n\n## \uD83E\uDDE0 Final Integration:\n- Use 'validatestudyconfig' tool to validate study config you generated.\n- Don't forget to add the generated study to the **global config file** so it becomes accessible.\n- Use 'validateglobalconfig' tool to validate global config.");
        return [2 /*return*/, {
                content: [{
                        type: "text",
                        text: enhancedPrompt
                    }]
            }];
    });
}); });
server.registerTool("validateglobalconfig", {
    title: "Global Config Validator",
    description: "Validate the global.json config file specifically",
    inputSchema: {}
}, function () { return __awaiter(void 0, void 0, void 0, function () {
    var fs, filePath, fileContent, readError_1, data, validationResult, configCount, listCount, errorMessages, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
            case 1:
                fs = _a.sent();
                filePath = path_1.default.join(__dirname, '..', '..', 'public', 'global.json');
                fileContent = void 0;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs.readFile(filePath, 'utf-8')];
            case 3:
                fileContent = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                readError_1 = _a.sent();
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "\u274C Failed to read global config file '".concat(filePath, "': ").concat(readError_1 instanceof Error ? readError_1.message : 'Unknown error')
                            }]
                    }];
            case 5:
                data = void 0;
                try {
                    data = JSON.parse(fileContent);
                }
                catch (parseError) {
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u274C Failed to parse JSON from global config file '".concat(filePath, "': ").concat(parseError instanceof Error ? parseError.message : 'Unknown error')
                                }]
                        }];
                }
                validationResult = (0, utils_1.validateGlobalConfig)(data);
                if (validationResult.isValid) {
                    configCount = Object.keys(data.configs || {}).length;
                    listCount = (data.configsList || []).length;
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u2705 Global config file '".concat(filePath, "' is valid!\n\n\uD83D\uDCCA Summary:\n\u2022 Total configs defined: ").concat(configCount, "\n\u2022 Configs in list: ").concat(listCount, "\n\u2022 All configs properly referenced: \u2705")
                                }]
                        }];
                }
                else {
                    errorMessages = validationResult.errors.map(function (error) {
                        var _a;
                        if (error.instancePath && error.message) {
                            return "You have an error at ".concat(error.instancePath, ": ").concat(error.message).concat(((_a = error.params) === null || _a === void 0 ? void 0 : _a.action) ? " - ".concat(JSON.stringify(error.params)) : '');
                        }
                        return "\u2022 ".concat(error.message || error);
                    });
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u274C Global config file '".concat(filePath, "' validation failed:\n\n").concat(errorMessages.join('\n'))
                                }]
                        }];
                }
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "\u274C Global config validation error: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                            }]
                    }];
            case 7: return [2 /*return*/];
        }
    });
}); });
server.registerTool("validatestudyconfig", {
    title: "Study Config Validator",
    description: "Validate study config files",
    inputSchema: {
        filePath: zod_1.z.string().describe("Path to the study config file to validate")
    }
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var fs, resolvedPath, fileContent, readError_2, data, validationResult, componentCount, baseComponentCount, importedLibrariesCount, errorMessages, error_2;
    var filePath = _b.filePath;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
            case 1:
                fs = _c.sent();
                resolvedPath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.join(__dirname, '..', '..', filePath);
                fileContent = void 0;
                _c.label = 2;
            case 2:
                _c.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs.readFile(resolvedPath, 'utf-8')];
            case 3:
                fileContent = _c.sent();
                return [3 /*break*/, 5];
            case 4:
                readError_2 = _c.sent();
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "\u274C Failed to read study config file '".concat(resolvedPath, "': ").concat(readError_2 instanceof Error ? readError_2.message : 'Unknown error')
                            }]
                    }];
            case 5:
                data = void 0;
                try {
                    data = JSON.parse(fileContent);
                }
                catch (parseError) {
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u274C Failed to parse JSON from study config file '".concat(filePath, "': ").concat(parseError instanceof Error ? parseError.message : 'Unknown error')
                                }]
                        }];
                }
                validationResult = (0, utils_1.validateStudyConfig)(data);
                if (validationResult.isValid) {
                    componentCount = Object.keys(data.components || {}).length;
                    baseComponentCount = Object.keys(data.baseComponents || {}).length;
                    importedLibrariesCount = (data.importedLibraries || []).length;
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u2705 Study config file '".concat(resolvedPath, "' is valid!\n\n\uD83D\uDCCA Summary:\n\u2022 Components defined: ").concat(componentCount, "\n\u2022 Base components: ").concat(baseComponentCount, "\n\u2022 Imported libraries: ").concat(importedLibrariesCount, "\n\u2022 All required fields present: \u2705")
                                }]
                        }];
                }
                else {
                    errorMessages = validationResult.errors.map(function (error) {
                        var _a;
                        if (error.instancePath && error.message) {
                            return "You have an error at ".concat(error.instancePath, ": ").concat(error.message).concat(((_a = error.params) === null || _a === void 0 ? void 0 : _a.action) ? " - ".concat(JSON.stringify(error.params)) : '');
                        }
                        return "\u2022 ".concat(error.message || error);
                    });
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "\u274C Study config file '".concat(resolvedPath, "' validation failed:\n\nThere was an issue loading the study config. Please check the following issues:\n\n").concat(errorMessages.join('\n'))
                                }]
                        }];
                }
                return [3 /*break*/, 7];
            case 6:
                error_2 = _c.sent();
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "\u274C Study config validation error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error')
                            }]
                    }];
            case 7: return [2 /*return*/];
        }
    });
}); });
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var transport;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Load schemas before starting the server
            return [4 /*yield*/, (0, utils_1.loadSchemas)()];
            case 1:
                // Load schemas before starting the server
                _a.sent();
                transport = new stdio_js_1.StdioServerTransport();
                return [4 /*yield*/, server.connect(transport)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
