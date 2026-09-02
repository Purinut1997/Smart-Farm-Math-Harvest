export class MathSystem {
    constructor(game) {
        this.game = game;
        
        this.modal = document.getElementById('math-modal');
        this.titleEl = document.getElementById('math-title');
        this.questionEl = document.getElementById('math-question');
        this.inputsEl = document.getElementById('math-inputs');
        this.submitBtn = document.getElementById('math-submit');
        this.cancelBtn = document.getElementById('math-cancel');
        
        this.onSuccess = null;
        this.onFail = null;
        this.currentAnswer = null;
        
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
    }

    showModal(title, question, generateInputsFn, answer) {
        this.game.state = 'MATH_PUZZLE';
        this.titleEl.innerText = title;
        this.questionEl.innerText = question;
        this.inputsEl.innerHTML = '';
        generateInputsFn(this.inputsEl);
        this.currentAnswer = answer;
        this.modal.classList.add('active');
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.game.state = 'PLAYING';
        this.onSuccess = null;
        this.onFail = null;
    }

    checkAnswer() {
        const input = document.getElementById('math-answer-input');
        if (!input) return;
        
        const val = parseFloat(input.value);
        // Compare with slight tolerance for float math
        if (Math.abs(val - this.currentAnswer) < 0.01) {
            alert('ถูกต้อง! ยอดเยี่ยมมาก');
            if (this.onSuccess) this.onSuccess(this.currentAnswer);
            this.closeModal();
        } else {
            if (this.onFail) {
                const shouldClose = this.onFail();
                if (shouldClose) {
                    this.closeModal();
                    return;
                }
            }
            alert('ไม่ถูกต้อง ลองใหม่อีกครั้ง!');
            input.value = '';
        }
    }

    async fetchPuzzle(type) {
        // Use 100% local generation for instant response
        return this.generateLocalPuzzle(type);
    }

    generateLocalPuzzle(type) {
        const a = Math.floor(Math.random() * 9) + 2; // 2 to 10
        const b = Math.floor(Math.random() * 9) + 2;
        
        if (type === 'expand') {
            return {
                title: "คำนวณพื้นที่ด่วน!",
                question: `ฟาร์มกว้าง ${a} เมตร ยาว ${b} เมตร จะมีพื้นที่ทั้งหมดกี่ตารางเมตร?`,
                answer: a * b
            };
        } else if (type === 'water') {
            return {
                title: "เติมน้ำลงบัว",
                question: `มีน้ำอยู่ ${a} ลิตร เติมเพิ่มอีก ${b} ลิตร รวมเป็นกี่ลิตร?`,
                answer: a + b
            };
        } else if (type === 'heal') {
            const op = Math.random() > 0.5 ? '+' : '*';
            const ans = op === '+' ? a + b : a * b;
            const opName = op === '+' ? 'บวก' : 'คูณ';
            return {
                title: "รักษาพืชที่เหี่ยวเฉา",
                question: `จงหาผลลัพธ์: ${a} ${op} ${b} = ?`,
                answer: ans
            };
        } else {
            // fallback
            return { title: "?", question: "?", answer: 0 };
        }
    }

    async triggerAreaPuzzle(callback) {
        this.onSuccess = callback;
        this.onFail = null;
        const puzzle = await this.fetchPuzzle('expand');
        
        this.showModal(
            puzzle.title,
            puzzle.question,
            (container) => {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'math-answer-input';
                input.placeholder = 'ระบุคำตอบ';
                container.appendChild(input);
            },
            puzzle.answer
        );
    }

    async triggerFractionPuzzle(callback) {
        this.onSuccess = callback;
        this.onFail = null;
        const puzzle = await this.fetchPuzzle('water');
        
        this.showModal(
            puzzle.title,
            puzzle.question,
            (container) => {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'math-answer-input';
                input.placeholder = 'ระบุคำตอบ';
                container.appendChild(input);
            },
            puzzle.answer
        );
    }

    async triggerHealPuzzle(onSuccess, onFail) {
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        const puzzle = await this.fetchPuzzle('heal');
        
        this.showModal(
            puzzle.title,
            puzzle.question,
            (container) => {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'math-answer-input';
                input.placeholder = 'ระบุคำตอบ';
                container.appendChild(input);
            },
            puzzle.answer
        );
    }
}
