# ksOCR
เป็นฟังก์ชันสำหรับผู้ที่สนใจศึกษาการใช้งานเรื่อง Image processing ในการจำแนกรูปภาพ และรู้จำตัวอักษรโดยใช้วิธีทางโครงข่ายประสาทเทียม (Neural Network) แบบชั้นเดียว ซึ่งได้พัฒนาการเขียนด้วยภาษา Javascript เพื่อให้สามารถใช้งานได้ง่ายและรวดเร็ว โดยไม่ต้องติดตั้งเครื่องมือมากนักเพียงแต่ใช้รันผ่านเว็บบราวเซอร์ได้เลย

![capture](https://user-images.githubusercontent.com/28483094/36240444-4d8fa7ea-1244-11e8-8ea5-1e3069b69088.PNG)

### วิธีการใช้งาน
	<script src="ksOCR.js"></script>
	<script>
		var ocrObj = new ksOCR(option);
	</script>
option คือการกำหนดรูปแบบของจำแนกรูปตัวอักษร ซึ่งประกอบด้วย
   - threshold 		: เป็นค่าที่เป็นจุดตัดในพิกเซลของรูปภาพ ที่ต้องการแปลงเป็นรูปภาพ ขาว/ดำ
   - weight_width 	: ค่าความกว้างหลังจากแปลงขนาดรูปภาพให้อยู่สัดส่วนที่ต้องการ
   - weight_height 	: ค่าความสูงหลังจากแปลงขนาดรูปภาพให้อยู่สัดส่วนที่ต้องการ
