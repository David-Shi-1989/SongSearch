#!/bin/bash

# 显示提示弹窗：支持 Windows / macOS / Linux fallback，并调试输出 user_input
show_prompt_dialog() {
  local message="$1"
  local input=""
  local unameOut
  unameOut=$(uname -s)

  # 临时日志文件，用于调试输出（可自定义路径）
  local debug_log="/tmp/precommit-ui-debug.log"
  echo "👉 OS = $OS" > "$debug_log"
  echo "👉 uname = $unameOut" >> "$debug_log"

  if [ "$OS" = "Windows_NT" ] || echo "$unameOut" | grep -qE "MINGW.*|MSYS.*"; then
    echo "🟡 Windows detected ($unameOut)" >> "$debug_log"

    # 写入临时文件
    tmp_msg_file=$(mktemp)
    echo "$message" > "$tmp_msg_file"
    win_path=$(cygpath -w "$tmp_msg_file")

    # 调用 PowerShell 弹窗
    input=$(powershell.exe -NoProfile -Command "& {
      Add-Type -AssemblyName Microsoft.VisualBasic;
      \$content = Get-Content -Raw -Encoding UTF8 \"${win_path}\";
      \$result = [Microsoft.VisualBasic.Interaction]::InputBox(\$content, 'Git Pre-Commit Hook', '');
      Write-Output \$result
    }")

    rm -f "$tmp_msg_file"
  elif [ "$unameOut" = "Darwin" ]; then
    echo "🍎 macOS detected ($unameOut)" >> "$debug_log"
    input=$(osascript -e "tell app \"System Events\" to display dialog \"$message\" default answer \"\"" -e "text returned of result")
  else
    echo "🟢 Fallback to terminal input" >> "$debug_log"
    echo "$message"
    read -p "> " input
  fi

  # 清理输入结果（去除 \r \n 空格）
  original_input="$input"
  input=$(echo "$input" | sed 's/[\r\n]//g' | xargs)

  # 调试输出
  echo "🧪 original_input = '$original_input'" >> "$debug_log"
  echo "🧪 cleaned_input  = '$input'" >> "$debug_log"

  # 返回结果
  echo "$input"
}
