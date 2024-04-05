import os
import shutil

server_path = r'your-emby-server-path\Emby-Server\system\dashboard-ui'
source_code_path = r'your-source-code-folder-path'

###################################### config #####################################
copy_js_flag = 1
update_index_flag = 1
###################################################################################

if copy_js_flag:
    js_files = [f for f in os.listdir(source_code_path) if f.endswith('.js')]
    index_path = os.path.join(server_path, 'index.html')

    # Open the file in 'read' mode to read its content
    with open(index_path, 'r') as file:
        content = file.readlines()

    # Find the index where the <head> tag is located
    head_index = content.index('<head>\n')

    for js_file in js_files:
        script_line = f'<script type="text/javascript" src="{js_file}"></script>\n'
        if script_line not in content:
            content.insert(head_index, script_line)
            print(f"Script line '{script_line}' inserted into {index_path}")
        dst_file = os.path.join(server_path, js_file)
        if os.path.exists(dst_file):
            os.remove(dst_file)
        shutil.copy(os.path.join(source_code_path, js_file), dst_file)
        print(f"{js_file} copied from source_code_path to server_path")

    if update_index_flag:
        # Open the file in 'write' mode to save the changes
        with open(index_path, 'w') as file:
            file.writelines(content)
