#!/usr/bin/env python3
"""Sign an ASCENSION AAB with the existing upload identity only.
Credentials stay local; no key generation, upload, or publication is performed.
"""
import argparse, getpass, os, re, subprocess
from pathlib import Path
EXPECTED='98:67:BD:42:69:0A:0C:DA:93:40:08:BB:77:70:D5:47:AC:38:E0:B4:CD:FD:F1:24:37:A9:7C:00:CF:65:3E:E7'
def run(args, env):
    p=subprocess.run(args,env=env,text=True,capture_output=True)
    if p.returncode: raise SystemExit('Signing tool failed. Check the original key, password, and input AAB. No replacement key was created.')
    return p.stdout+p.stderr

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--keystore',type=Path,required=True)
    p.add_argument('--input',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--password-file',type=Path,help='Private local file outside the repository; never uploaded.')
    a=p.parse_args()
    if not a.keystore.is_file() or not a.input.is_file():p.error('Keystore and input AAB must exist')
    if a.output.exists():p.error('Output exists; choose a new output path')
    password=a.password_file.read_text().rstrip('\r\n') if a.password_file else getpass.getpass('Original ASCENSION upload keystore password: ')
    env=os.environ.copy();env['ASCENSION_UPLOAD_PASSWORD']=password
    info=run(['keytool','-J-Duser.language=en','-list','-v','-storetype','PKCS12','-keystore',str(a.keystore),'-storepass:env','ASCENSION_UPLOAD_PASSWORD'],env)
    if EXPECTED not in info:raise SystemExit('STOP: upload certificate does not match the established ASCENSION identity')
    aliases=re.findall(r'^Alias name: (.+)$',info,re.M)
    if len(aliases)!=1:raise SystemExit('STOP: ambiguous keystore aliases')
    run(['java','-m','jdk.jartool/sun.security.tools.jarsigner.Main','-keystore',str(a.keystore),'-storetype','PKCS12','-storepass:env','ASCENSION_UPLOAD_PASSWORD','-keypass:env','ASCENSION_UPLOAD_PASSWORD','-sigalg','SHA256withRSA','-digestalg','SHA-256','-signedjar',str(a.output),str(a.input),aliases[0]],env)
    result=run(['java','-m','jdk.jartool/sun.security.tools.jarsigner.Main','-verify',str(a.output)],env)
    if 'jar verified.' not in result:raise SystemExit('STOP: AAB signature verification did not pass')
    import hashlib
    print('PASS: signed with the established ASCENSION upload certificate')
    print('SHA256:',hashlib.sha256(a.output.read_bytes()).hexdigest())
if __name__=='__main__':main()
