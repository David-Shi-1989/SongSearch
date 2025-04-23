#!/bin/bash

# --- Windows dialog implementation ---
show_prompt_dialog_windows() {
  local message="$1"
  local input=""
  tmp_msg_file=$(mktemp)
  echo "$message" > "$tmp_msg_file"
  win_path=$(cygpath -w "$tmp_msg_file")

  input=$(powershell.exe -NoProfile -Command "& {
    Add-Type -AssemblyName Microsoft.VisualBasic;
    \$content = Get-Content -Raw -Encoding UTF8 \"${win_path}\";
    \$result = [Microsoft.VisualBasic.Interaction]::InputBox(\$content, 'Git Pre-Commit Hook', '');
    Write-Output \$result
  }")

  rm -f "$tmp_msg_file"
  input=$(printf "%s" "$input" | tr -d '\r\n' | xargs)
  echo "$input"
}

# --- macOS dialog implementation ---
show_prompt_dialog_macos() {
  local message="$1"
  local input=""

  input=$(osascript -e "tell app \"System Events\" to display dialog \"$message\" default answer \"\"" -e "text returned of result")
  input=$(printf "%s" "$input" | tr -d '\r\n' | xargs)
  echo "$input"
}

# --- Terminal fallback ---
show_prompt_dialog_terminal() {
  local message="$1"
  local input=""
  echo "$message"
  read -p "> " input
  input=$(printf "%s" "$input" | tr -d '\r\n' | xargs)
  echo "$input"
}

# --- Main dispatcher ---
show_prompt_dialog() {
  local message="$1"
  local unameOut
  unameOut=$(uname -s)

  if [ "$OS" = "Windows_NT" ] || echo "$unameOut" | grep -qE "MINGW.*|MSYS.*"; then
    show_prompt_dialog_windows "$message"
  elif [ "$unameOut" = "Darwin" ]; then
    show_prompt_dialog_macos "$message"
  else
    show_prompt_dialog_terminal "$message"
  fi
}
