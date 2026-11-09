const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

const FORBIDDEN_SYNTAX = {
  WhileStatement: "цикл while запрещён — используйте обход массива",
  DoWhileStatement: "цикл do-while запрещён — используйте обход массива",
  BreakStatement: "break запрещён — вынесите условие в отдельную функцию",
  ContinueStatement: "continue запрещён — используйте filter/map",
};

function visitorKeysFor(node) {
  return node.type ? Object.keys(node).filter((key) => key !== "parent") : [];
}

function isFunctionNode(node) {
  return Boolean(node && FUNCTION_TYPES.has(node.type));
}

function walk(node, visit, stopAtFunction) {
  if (!node || typeof node.type !== "string") return;
  if (visit(node) === false) return;
  if (stopAtFunction && isFunctionNode(node)) return;
  visitorKeysFor(node).forEach((key) => {
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => walk(item, visit, stopAtFunction));
      return;
    }
    if (child && typeof child.type === "string") walk(child, visit, stopAtFunction);
  });
}

function functionBodyStatements(fnNode) {
  if (fnNode.body && fnNode.body.type === "BlockStatement") return fnNode.body.body;
  return fnNode.body ? [fnNode.body] : [];
}

function collectReturns(fnNode) {
  const found = [];
  functionBodyStatements(fnNode).forEach((statement) => {
    walk(statement, (node) => {
      if (!isFunctionNode(node) && node.type === "ReturnStatement") found.push(node);
      return true;
    }, true);
  });
  return found;
}

function isNestedBlocked(node) {
  return Boolean(node.parent && node.parent.type !== "BlockStatement" && node.parent.type !== "Program");
}

export const rules = {
  "single-return": {
    meta: {
      type: "problem",
      docs: { description: "Функция должна иметь ровно один выход" },
      schema: [],
      messages: {
        tooMany: "У функции {{count}} выходов, разрешён максимум один — единственный return в конце.",
      },
    },
    create(context) {
      return {
        "Program:exit"(program) {
          walk(program, (node) => {
            if (!isFunctionNode(node)) return true;
            const returns = collectReturns(node);
            if (returns.length > 1) {
              context.report({ node, messageId: "tooMany", data: { count: returns.length } });
            }
            return false;
          }, false);
        },
      };
    },
  },

  "no-early-return": {
    meta: {
      type: "problem",
      docs: { description: "return разрешён только последней строкой тела функции" },
      schema: [],
      messages: {
        early: "Ранний выход запрещён: return должен быть последней строкой функции.",
        branch: "Выход из ветки запрещён: перенесите вычисление в отдельную функцию.",
      },
    },
    create(context) {
      return {
        ReturnStatement(node) {
          if (node.parent && node.parent.type === "BlockStatement" && isNestedBlocked(node)) {
            context.report({ node, messageId: "branch" });
            return;
          }
          if (node.parent && node.parent.type !== "BlockStatement" && node.parent.type !== "Program") {
            context.report({ node, messageId: "branch" });
            return;
          }
          const siblings = node.parent ? node.parent.body : [];
          const index = siblings.indexOf(node);
          if (index >= 0 && index < siblings.length - 1) {
            context.report({ node, messageId: "early" });
          }
        },
      };
    },
  },

  "max-statements": {
    meta: {
      type: "suggestion",
      docs: { description: "Ограничение количества строк в теле функции" },
      schema: [{ type: "integer", minimum: 1 }],
      messages: {
        tooLong: "В функции {{count}} строк, лимит — {{max}}. Разбейте на более мелкие функции.",
      },
    },
    create(context) {
      const max = context.options[0] || 2;
      return {
        "Program:exit"(program) {
          walk(program, (node) => {
            if (!isFunctionNode(node)) return true;
            const count = functionBodyStatements(node).length;
            if (count > max) {
              context.report({ node, messageId: "tooLong", data: { count, max } });
            }
            return false;
          }, false);
        },
      };
    },
  },

  "no-forbidden-syntax": {
    meta: {
      type: "problem",
      docs: { description: "Запрет while, do-while, break и continue" },
      schema: [],
      messages: { forbidden: "{{reason}}" },
    },
    create(context) {
      const handlers = {};
      Object.keys(FORBIDDEN_SYNTAX).forEach((type) => {
        handlers[type] = (node) => {
          context.report({ node, messageId: "forbidden", data: { reason: FORBIDDEN_SYNTAX[type] } });
        };
      });
      return handlers;
    },
  },
};

export default { rules };
