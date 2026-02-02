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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchemas = loadSchemas;
exports.validateGlobalConfig = validateGlobalConfig;
exports.isInheritedComponent = isInheritedComponent;
exports.isDynamicBlock = isDynamicBlock;
exports.getSequenceFlatMapWithInterruptions = getSequenceFlatMapWithInterruptions;
exports.verifyStudySkip = verifyStudySkip;
exports.validateStudyConfig = validateStudyConfig;
var path_1 = require("path");
var ajv_1 = require("ajv");
// Load the actual JSON schemas from the Revisit project
var globalConfigSchema = null;
var studyConfigSchema = null;
var globalValidate = null;
var studyValidate = null;
function loadSchemas() {
    return __awaiter(this, void 0, void 0, function () {
        var fs, globalSchemaPath, globalSchemaContent, studySchemaPath, studySchemaContent, ajv1, ajv2, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                case 1:
                    fs = _a.sent();
                    globalSchemaPath = path_1.default.join(__dirname, '..', '..', 'src', 'parser', 'GlobalConfigSchema.json');
                    return [4 /*yield*/, fs.readFile(globalSchemaPath, 'utf-8')];
                case 2:
                    globalSchemaContent = _a.sent();
                    globalConfigSchema = JSON.parse(globalSchemaContent);
                    studySchemaPath = path_1.default.join(__dirname, '..', '..', 'src', 'parser', 'StudyConfigSchema.json');
                    return [4 /*yield*/, fs.readFile(studySchemaPath, 'utf-8')];
                case 3:
                    studySchemaContent = _a.sent();
                    studyConfigSchema = JSON.parse(studySchemaContent);
                    ajv1 = new ajv_1.default();
                    ajv1.addSchema(globalConfigSchema);
                    globalValidate = ajv1.getSchema('#/definitions/GlobalConfig');
                    ajv2 = new ajv_1.default();
                    ajv2.addSchema(studyConfigSchema);
                    studyValidate = ajv2.getSchema('#/definitions/StudyConfig');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to load schemas:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Validation function for global config (following Revisit's approach)
function validateGlobalConfig(data) {
    if (!globalValidate) {
        return { isValid: false, errors: [{ message: 'Schema not loaded' }] };
    }
    var schemaValid = globalValidate(data);
    var schemaErrors = globalValidate.errors || [];
    // Additional custom validation (like Revisit's verifyGlobalConfig)
    var customErrors = [];
    if (data.configsList && data.configs) {
        data.configsList.forEach(function (configName) {
            if (!data.configs[configName]) {
                customErrors.push({
                    message: "Config ".concat(configName, " is not defined in configs object, but is present in configsList"),
                    instancePath: '/configsList',
                    params: { action: 'add the config to the configs object or remove it from configsList' }
                });
            }
        });
    }
    return {
        isValid: schemaValid && customErrors.length === 0,
        errors: __spreadArray(__spreadArray([], schemaErrors, true), customErrors, true)
    };
}
// Helper function to check if a component is an inherited component
function isInheritedComponent(comp) {
    return comp && typeof comp === 'object' && comp.baseComponent !== undefined;
}
// Helper function to check if a sequence is a dynamic block
function isDynamicBlock(sequence) {
    return sequence && sequence.order === 'dynamic';
}
// Helper function to get flat map of components from sequence (including interruptions)
function getSequenceFlatMapWithInterruptions(sequence) {
    var components = [];
    if (isDynamicBlock(sequence)) {
        return components; // Dynamic blocks can't be statically analyzed
    }
    if (!sequence.components || !Array.isArray(sequence.components)) {
        return components;
    }
    sequence.components.forEach(function (component) {
        if (typeof component === 'string') {
            components.push(component);
        }
        else if (component && typeof component === 'object') {
            // Recursively handle nested blocks
            components.push.apply(components, getSequenceFlatMapWithInterruptions(component));
        }
    });
    // Handle interruptions
    if (sequence.interruptions && Array.isArray(sequence.interruptions)) {
        sequence.interruptions.forEach(function (interruption) {
            if (interruption.components && Array.isArray(interruption.components)) {
                interruption.components.forEach(function (comp) {
                    if (typeof comp === 'string') {
                        components.push(comp);
                    }
                });
            }
        });
    }
    return components;
}
// Helper function to verify skip logic
function verifyStudySkip(sequence, skipTargets, errors) {
    if (skipTargets === void 0) { skipTargets = []; }
    if (errors === void 0) { errors = []; }
    if (isDynamicBlock(sequence)) {
        return skipTargets; // Can't verify skip logic for dynamic blocks
    }
    // Base case: empty sequence
    if (!sequence.components || sequence.components.length === 0) {
        errors.push({
            message: 'Sequence has an empty components array',
            instancePath: '/sequence/',
            params: { action: 'remove empty components block' },
        });
        return skipTargets;
    }
    // If the block has an ID, remove it from the skipTargets array
    if (sequence.id) {
        var idxToRemove = skipTargets
            .map(function (target, idx) { return (target === sequence.id ? idx : null); })
            .filter(function (idx) { return idx !== null; });
        idxToRemove.forEach(function (idx, i) {
            skipTargets.splice(idx - i, 1);
        });
    }
    // Process components
    sequence.components.forEach(function (component) {
        if (typeof component === 'string') {
            // If the component is a string, check if it is in the skipTargets array
            var idxToRemove = skipTargets
                .map(function (target, idx) { return (target === component ? idx : null); })
                .filter(function (idx) { return idx !== null; });
            idxToRemove.forEach(function (idx, i) {
                skipTargets.splice(idx - i, 1);
            });
        }
        else if (component && typeof component === 'object') {
            // Recursive case: component is a block
            verifyStudySkip(component, skipTargets, errors);
        }
    });
    // If this block has a skip, add the skip.to component to the skipTargets array
    if (sequence.skip && Array.isArray(sequence.skip)) {
        sequence.skip.forEach(function (skip) {
            if (skip.to && skip.to !== 'end') {
                skipTargets.push(skip.to);
            }
        });
    }
    return skipTargets;
}
// Validation function for study config (following Revisit's approach)
function validateStudyConfig(data) {
    if (!studyValidate) {
        return { isValid: false, errors: [{ message: 'Schema not loaded' }] };
    }
    var schemaValid = studyValidate(data);
    var schemaErrors = studyValidate.errors || [];
    // Additional custom validation (like Revisit's verifyStudyConfig)
    var customErrors = [];
    if (data.components && typeof data.components === 'object') {
        Object.entries(data.components).forEach(function (_a) {
            var _b;
            var componentName = _a[0], component = _a[1];
            // Verify baseComponent is defined in baseComponents object
            if (isInheritedComponent(component) && !((_b = data.baseComponents) === null || _b === void 0 ? void 0 : _b[component.baseComponent])) {
                customErrors.push({
                    message: "Base component `".concat(component.baseComponent, "` is not defined in baseComponents object"),
                    instancePath: "/components/".concat(componentName),
                    params: { action: 'add the base component to the baseComponents object' },
                });
            }
        });
    }
    // Verify components are well defined in sequence
    if (data.sequence) {
        var usedComponents = getSequenceFlatMapWithInterruptions(data.sequence);
        usedComponents.forEach(function (componentName) {
            var _a, _b;
            // Verify component is defined in components object
            if (!((_a = data.components) === null || _a === void 0 ? void 0 : _a[componentName])) {
                var isBaseComponent = (_b = data.baseComponents) === null || _b === void 0 ? void 0 : _b[componentName];
                customErrors.push({
                    message: isBaseComponent
                        ? "Component `".concat(componentName, "` is a base component and cannot be used in the sequence")
                        : "Component `".concat(componentName, "` is not defined in components object"),
                    instancePath: '/sequence/',
                    params: { action: 'add the component to the components object' },
                });
            }
        });
    }
    // Verify skip blocks are well defined
    if (data.sequence) {
        var missingSkipTargets = verifyStudySkip(data.sequence, [], customErrors);
        missingSkipTargets.forEach(function (skipTarget) {
            customErrors.push({
                message: "Skip target `".concat(skipTarget, "` does not occur after the skip block it is used in"),
                instancePath: '/sequence/',
                params: { action: 'add the target to the sequence after the skip block' },
            });
        });
    }
    // Validate response types and their properties
    if (data.components && typeof data.components === 'object') {
        Object.entries(data.components).forEach(function (_a) {
            var componentName = _a[0], component = _a[1];
            if (component.response && Array.isArray(component.response)) {
                component.response.forEach(function (response, responseIndex) {
                    var responsePath = "/components/".concat(componentName, "/response/").concat(responseIndex);
                    // Validate response type
                    if (!response.type) {
                        customErrors.push({
                            message: 'Response must have a type',
                            instancePath: responsePath,
                            params: { action: 'specify a response type' },
                        });
                    }
                    // Validate new response types
                    if (response.type === 'textOnly') {
                        // TextOnly responses don't need required fields
                        if (response.required !== undefined) {
                            customErrors.push({
                                message: 'TextOnly responses cannot be required',
                                instancePath: responsePath,
                                params: { action: 'remove the required field from TextOnly response' },
                            });
                        }
                    }
                    // Validate matrix responses
                    if (response.type === 'matrix-radio' || response.type === 'matrix-checkbox') {
                        if (!response.answerOptions) {
                            customErrors.push({
                                message: 'Matrix responses must have answerOptions',
                                instancePath: responsePath,
                                params: { action: 'add answerOptions to matrix response' },
                            });
                        }
                        if (!response.questionOptions || !Array.isArray(response.questionOptions)) {
                            customErrors.push({
                                message: 'Matrix responses must have questionOptions array',
                                instancePath: responsePath,
                                params: { action: 'add questionOptions array to matrix response' },
                            });
                        }
                    }
                    // Validate buttons responses
                    if (response.type === 'buttons') {
                        if (!response.options || !Array.isArray(response.options)) {
                            customErrors.push({
                                message: 'Buttons responses must have options array',
                                instancePath: responsePath,
                                params: { action: 'add options array to buttons response' },
                            });
                        }
                    }
                    // Validate slider responses
                    if (response.type === 'slider') {
                        if (!response.options || !Array.isArray(response.options)) {
                            customErrors.push({
                                message: 'Slider responses must have options array',
                                instancePath: responsePath,
                                params: { action: 'add options array to slider response' },
                            });
                        }
                    }
                });
            }
        });
    }
    // Validate library usage if importedLibraries are present
    if (data.importedLibraries && Array.isArray(data.importedLibraries)) {
        data.importedLibraries.forEach(function (libraryName, index) {
            if (typeof libraryName !== 'string' || !libraryName.trim()) {
                customErrors.push({
                    message: 'Library name must be a non-empty string',
                    instancePath: "/importedLibraries/".concat(index),
                    params: { action: 'provide a valid library name' },
                });
            }
        });
    }
    // Validate UI config enhancements
    if (data.uiConfig) {
        var uiConfig = data.uiConfig;
        // Validate screen recording requirements
        if (uiConfig.recordScreen && uiConfig.recordScreenFPS) {
            if (typeof uiConfig.recordScreenFPS !== 'number' || uiConfig.recordScreenFPS <= 0) {
                customErrors.push({
                    message: 'recordScreenFPS must be a positive number',
                    instancePath: '/uiConfig/recordScreenFPS',
                    params: { action: 'provide a valid FPS value' },
                });
            }
        }
        // Validate screen size requirements
        if (uiConfig.minWidthSize && (typeof uiConfig.minWidthSize !== 'number' || uiConfig.minWidthSize <= 0)) {
            customErrors.push({
                message: 'minWidthSize must be a positive number',
                instancePath: '/uiConfig/minWidthSize',
                params: { action: 'provide a valid width size' },
            });
        }
        if (uiConfig.minHeightSize && (typeof uiConfig.minHeightSize !== 'number' || uiConfig.minHeightSize <= 0)) {
            customErrors.push({
                message: 'minHeightSize must be a positive number',
                instancePath: '/uiConfig/minHeightSize',
                params: { action: 'provide a valid height size' },
            });
        }
    }
    return {
        isValid: schemaValid && customErrors.length === 0,
        errors: __spreadArray(__spreadArray([], schemaErrors, true), customErrors, true)
    };
}
