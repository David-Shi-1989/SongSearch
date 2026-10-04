const os = require('os')
const { execSync } = require('child_process')

function encodeToBase64(str) {
  return Buffer.from(str, 'utf16le').toString('base64')
}

/**
 * 在 Windows 下弹出输入框
 * @param {string} title - 弹窗标题
 * @param {string[]} messageLines - 消息内容，每行一个字符串
 * @returns {string|null} 用户输入，取消则为 null
 */
/**
 * Windows 专用：弹窗输入框（支持 message 数组 + 自适应高度）
 * @param {string} title - 弹窗标题
 * @param {string[]} messageLines - 每行一个字符串
 * @returns {string|null} 用户输入（取消返回 null）
 */
function createWindowsPrompt(title, messageLines) {
  if (os.platform() !== 'win32') {
    console.error('❌ createWindowsPrompt only works on Windows.');
    return null;
  }

  if (!Array.isArray(messageLines)) {
    console.error('❌ message must be an array of strings.');
    return null;
  }

  const escapedTitle = title.replace(/'/g, "''");

  // 转义 PowerShell 字符并组合为数组
  const powershellArray = messageLines
    .map(line =>
      `"${line.replace(/`/g, '``').replace(/"/g, '`"').replace(/'/g, "''")}"`
    )
    .join(',');

  // ⏬ 动态估算需要显示的高度
  const charsPerLine = 55;
  const lineHeight = 20;
  const totalCharCount = messageLines.reduce((sum, line) => sum + line.length, 0);
  const estimatedLines = Math.max(messageLines.length, Math.ceil(totalCharCount / charsPerLine));
  const infoBoxHeight = Math.max(40, estimatedLines * lineHeight);
  const formHeight = infoBoxHeight + 130;

  // PowerShell 脚本
  const powershellScript = `
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object Windows.Forms.Form
$form.Text = '${escapedTitle}'
$form.Width = 420
$form.Height = ${formHeight}
$form.StartPosition = 'CenterScreen'

$infoBox = New-Object Windows.Forms.TextBox
$infoBox.Multiline = $true
$infoBox.ReadOnly = $true
$infoBox.BorderStyle = 'None'
$infoBox.BackColor = $form.BackColor
$infoBox.Text = (@(${powershellArray}) -join "\`r\`n")
$infoBox.Width = 360
$infoBox.Height = ${infoBoxHeight}
$infoBox.Top = 20
$infoBox.Left = 20

$textBox = New-Object Windows.Forms.TextBox
$textBox.Width = 360
$textBox.Top = ${infoBoxHeight + 20}
$textBox.Left = 20

$okButton = New-Object Windows.Forms.Button
$okButton.Text = 'OK'
$okButton.Width = 75
$okButton.Top = ${infoBoxHeight + 50}
$okButton.Left = 220
$okButton.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::OK; $form.Close() })

$cancelButton = New-Object Windows.Forms.Button
$cancelButton.Text = 'Cancel'
$cancelButton.Width = 75
$cancelButton.Top = ${infoBoxHeight + 50}
$cancelButton.Left = 305
$cancelButton.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() })

$form.Controls.AddRange(@($infoBox, $textBox, $okButton, $cancelButton))
$form.AcceptButton = $okButton
$form.CancelButton = $cancelButton

$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::Cancel) {
  Write-Output '[CANCEL]'
} else {
  Write-Output $textBox.Text
}
`;

  const encoded = encodeToBase64(powershellScript);
  const command = `powershell -NoProfile -EncodedCommand ${encoded}`;

  try {
    const result = execSync(command, { encoding: 'utf8' }).trim();
    return result === '[CANCEL]' ? null : result;
  } catch (err) {
    console.error('❌ PowerShell execution failed:\n', err.message);
    return null;
  }
}

function promptUser(message, title = 'Git Pre-Commit') {
  try {
    const platform = os.platform()

    // Windows
    if (platform === 'win32') {
      const escapedMessage = message.replace(/'/g, "''");
      const escapedTitle = title.replace(/'/g, "''");

      const powershellScript = `
        Add-Type -AssemblyName System.Windows.Forms

        $form = New-Object Windows.Forms.Form
        $form.Text = '${escapedTitle}'
        $form.Width = 420
        $form.Height = 200
        $form.StartPosition = 'CenterScreen'

        $label = New-Object Windows.Forms.Label
        $label.Text = '${escapedMessage}'
        $label.AutoSize = $true
        $label.Top = 20
        $label.Left = 20

        $textBox = New-Object Windows.Forms.TextBox
        $textBox.Width = 360
        $textBox.Top = 60
        $textBox.Left = 20

        $okButton = New-Object Windows.Forms.Button
        $okButton.Text = 'OK'
        $okButton.Width = 75
        $okButton.Top = 110
        $okButton.Left = 230
        $okButton.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::OK; $form.Close() })

        $cancelButton = New-Object Windows.Forms.Button
        $cancelButton.Text = 'Cancel'
        $cancelButton.Width = 75
        $cancelButton.Top = 110
        $cancelButton.Left = 310
        $cancelButton.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() })

        $form.Controls.AddRange(@($label, $textBox, $okButton, $cancelButton))
        $form.AcceptButton = $okButton
        $form.CancelButton = $cancelButton

        $result = $form.ShowDialog()
        if ($result -eq [System.Windows.Forms.DialogResult]::Cancel) {
          Write-Output '[CANCEL]'
        } else {
          Write-Output $textBox.Text
        }
      `;

      const encoded = encodeToBase64(powershellScript);
      const command = `powershell -NoProfile -EncodedCommand ${encoded}`;

      try {
        const result = execSync(command, { encoding: 'utf8' }).trim();
        if (result === '[CANCEL]') return null;
        return result; // Can be "" or real input
      } catch (err) {
        console.error('❌ PowerShell execution failed:', err.message);
        return null;
      }
    }

    // macOS
    if (platform === 'darwin') {
      const script = `display dialog "${message}" default answer "" with title "${title}"`
      const result = execSync(`osascript -e '${script}' -e 'text returned of result'`, { encoding: 'utf8' })
      return result.trim()
    }

    // Other (Linux or fallback terminal)
    process.stdout.write(`${message}\n> `)
    return require('readline-sync').question().trim()

  } catch (err) {
    return null
  }
}

const USER_CONFIRM_INPUT_STRING = 'confirm'
const STR_SYMBOL = {
  BULLET_DOT: '•',
  BULLET_EMPTY_DOT: '◦',
  BULLET_DIAMOND: '◇',
  BULLET_CHECK: '✓',
  BULLET_WHITE_SQUARE: '□'
}
const STR_PLEASE_TYPE_CONFIRM = `Please type '${USER_CONFIRM_INPUT_STRING}' to proceed with the commit.`

const cn = 'main 分支已废弃。每月会创建新的 feature 分支进行开发，发布请手动 cherry-pick 到 release 分支。'
const en = 'The main branch has been deprecated. Use monthly feature branches for development and cherry-pick to release.'
const list = [
  '[Branch Rule]',
  '  • Currently we only use the main branch as the development and release branch, and do not use the release branch, so please modify the code with caution.',
  '  • 目前我们只使用main分支作为开发和发布分支，不使用release分支，所以请谨慎修改代码。',
  '',
  '----------------------------------------',
  '',
  '[Version Update Reminder]',
  '  • Reminder: Please remember to modify the version in package.json so that this modification will take effect. Jeknins address: https://jenkins.web.corp.zoom.us/job/Web/job/BillingWeb/job/fe-billing-utils/job/build/',
  '  • 提醒：请记得修改package.json里的version，以便让本次修改生效。Jeknins地址：https://jenkins.web.corp.zoom.us/job/Web/job/BillingWeb/job/fe-billing-utils/job/build/',
  '',
  '',
  'Please type confirm to proceed with the commit.'
]
var userInput = createWindowsPrompt('Pre-commit notification', list)
console.log(userInput)

module.exports = {
  promptUser,
  USER_CONFIRM_INPUT_STRING,
  STR_SYMBOL,
  STR_PLEASE_TYPE_CONFIRM
}