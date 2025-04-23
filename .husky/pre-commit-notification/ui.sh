#!/bin/bash

# Display input box based on OS: Windows (PowerShell), macOS (osascript), fallback to terminal
show_prompt_dialog() {
  local message="$1"
  local input=""
  local unameOut
  unameOut=$(uname -s)

  if [ "$OS" = "Windows_NT" ] || echo "$unameOut" | grep -qE "MINGW.*|MSYS.*"; then
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
  elif [ "$unameOut" = "Darwin" ]; then
    input=$(osascript -e "tell app \"System Events\" to display dialog \"$message\" default answer \"\"" -e "text returned of result")
  else
    echo "$message"
    read -p "> " input
  fi

  # Clean carriage return, newlines, and surrounding whitespace
  input=$(echo "$input" | sed 's/[\r\n]//g' | xargs)

  echo "$input"
}
