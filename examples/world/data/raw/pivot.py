import sys
f=open(sys.argv[1],'r')
lines=f.readlines()
#print lines
header=lines.pop(0).split('\t')
#print header
header.pop(0)
for line in lines:
	l=line.strip().split('\t')
	name=l.pop(0)
	for i in range(0,len(l)):
		print "%s	%s	%s" %(name,header[i].strip(),l[i])
