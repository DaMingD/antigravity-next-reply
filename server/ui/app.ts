import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';

interface SuggestionData {
  hint?: string;
  suggestions?: string[];
}

const root = document.getElementById('app')!;
const app = new App({ name: 'Next Reply Suggestions', version: '1.0.0' }, {});

let currentData: SuggestionData = {};
let sentText: string | null = null;
let sendingText: string | null = null;
let editingText: string | null = null;
let canSendMessage = false;
let errorText: string | null = null;

function applyTheme(ctx: ReturnType<typeof app.getHostContext>) {
  if (!ctx) return;
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
}

async function sendSuggestion(text: string) {
  const trimmed = text.trim();
  if (!trimmed || sentText || sendingText) return;
  errorText = null;

  if (!canSendMessage) {
    try {
      await navigator.clipboard.writeText(trimmed);
      errorText = '当前视图不支持直接发送，已复制到剪贴板。';
    } catch {
      errorText = '当前视图不支持直接发送消息。';
    }
    render();
    return;
  }

  sendingText = trimmed;
  editingText = null;
  render();

  try {
    await app.sendMessage({
      role: 'user',
      content: [{ type: 'text', text: trimmed }],
    });
    sentText = trimmed;
    sendingText = null;
  } catch (err) {
    sendingText = null;
    errorText = err instanceof Error ? `发送失败：${err.message}` : '发送失败，请重试。';
  }
  render();
}

function render() {
  const suggestions = currentData.suggestions ?? [];
  const hint = currentData.hint || '猜你下一步想说';

  root.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'nr-wrap';

  const header = document.createElement('div');
  header.className = 'nr-header';

  const title = document.createElement('span');
  title.className = 'nr-title';
  title.textContent = `✨ ${hint}`;
  header.appendChild(title);

  const sub = document.createElement('span');
  sub.className = 'nr-sub';
  sub.textContent = sentText
    ? '已发送'
    : sendingText
      ? '发送中...'
      : '点击直接发送 · 点 ✎ 可微调';
  header.appendChild(sub);

  wrapper.appendChild(header);

  if (suggestions.length === 0) {
    const loading = document.createElement('div');
    loading.className = 'nr-empty';
    loading.textContent = '正在生成快捷回复建议...';
    wrapper.appendChild(loading);
    root.appendChild(wrapper);
    return;
  }

  const list = document.createElement('div');
  list.className = 'nr-chips';

  suggestions.forEach((text, index) => {
    const isSent = sentText === text;
    const isSending = sendingText === text;
    const isDisabled = Boolean(sentText || sendingText);

    const group = document.createElement('div');
    group.className = 'nr-chip-group';
    if (isSent) group.classList.add('is-sent');
    if (isDisabled && !isSent) group.classList.add('is-dim');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nr-chip';
    btn.disabled = isDisabled;
    btn.title = canSendMessage ? '点击直接发送这条回复' : '点击复制';

    const badge = document.createElement('span');
    badge.className = 'nr-badge';
    badge.textContent = isSent ? '✓' : String(index + 1);
    btn.appendChild(badge);

    const label = document.createElement('span');
    label.className = 'nr-label';
    label.textContent = isSending ? `${text} …` : text;
    btn.appendChild(label);

    const arrow = document.createElement('span');
    arrow.className = 'nr-arrow';
    arrow.textContent = isSent ? '已发' : '↵';
    btn.appendChild(arrow);

    btn.addEventListener('click', () => {
      void sendSuggestion(text);
    });

    group.appendChild(btn);

    if (!isDisabled) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'nr-edit-btn';
      editBtn.title = '修改后再发送';
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingText = text;
        errorText = null;
        render();
        const input = root.querySelector<HTMLInputElement>('.nr-edit-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });
      group.appendChild(editBtn);
    }

    list.appendChild(group);
  });

  wrapper.appendChild(list);

  if (editingText !== null && !sentText) {
    const editRow = document.createElement('div');
    editRow.className = 'nr-edit-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'nr-edit-input';
    input.value = editingText;
    input.placeholder = '修改回复内容，按 Enter 发送...';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        void sendSuggestion(input.value);
      } else if (e.key === 'Escape') {
        editingText = null;
        render();
      }
    });

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'nr-edit-send';
    sendBtn.textContent = '发送 ↵';
    sendBtn.addEventListener('click', () => {
      void sendSuggestion(input.value);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'nr-edit-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => {
      editingText = null;
      render();
    });

    editRow.appendChild(input);
    editRow.appendChild(sendBtn);
    editRow.appendChild(cancelBtn);
    wrapper.appendChild(editRow);
  }

  if (errorText) {
    const errEl = document.createElement('div');
    errEl.className = 'nr-error';
    errEl.textContent = errorText;
    wrapper.appendChild(errEl);
  }

  root.appendChild(wrapper);
}

// Register handlers BEFORE connect() so no notification is missed.
app.ontoolinput = ({ arguments: args }) => {
  if (args && typeof args === 'object') {
    const data = args as SuggestionData;
    if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      currentData = data;
      render();
    }
  }
};

app.ontoolresult = (result) => {
  const sc = result.structuredContent as SuggestionData | undefined;
  if (sc && Array.isArray(sc.suggestions)) {
    currentData = sc;
    render();
  }
};

app.onhostcontextchanged = (ctx) => {
  applyTheme(ctx);
};

async function init() {
  render();
  await app.connect();
  applyTheme(app.getHostContext());
  const caps = app.getHostCapabilities() as Record<string, unknown> | undefined;
  canSendMessage = Boolean(caps && 'message' in caps && caps.message);
  render();
}

void init();
