#!/data/data/com.termux/files/usr/bin/bash

if [ -z "$1" ]; then
	echo "Erro no file provided"
	exit 1
fi

FILE=$1

#tsu
echo "Flashing microcontroller with $FILE..."

#cat $FILE
#mv $FILE files/renamed

#cd /data/data/com.termux/files/home/flash
/data/data/com.termux/files/home/sagar/bin/st-flash --reset write $FILE 0x8000000
#exit
