/**
 * STORE LOCALSTORAGE
 */
const LSController = (function () {
    return {
        addData: (data) => {
            localStorage.setItem('dataBudgetApp', JSON.stringify(data));
        },
        getData: () => {
            let data = JSON.parse(localStorage.getItem('dataBudgetApp'));
            return data;
        }
    }
}());

/**
 * BUDGET CONTROLLER
 */
const budgetController = (function () {
    class Income {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }

    class Expense {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
            this.percentage = -1;
        }
        calculatePercentage() {
            if (this.value == 0 || data.totals.inc == 0) {
                this.percentage = -1;
            } else {
                this.percentage = Math.round((this.value / data.totals.inc) * 100);
            }
        }
    }

    function calculateTotal() {
        const totalInc = data.items.inc.reduce((acc, cur) => acc + cur.value, 0);
        const totalExp = data.items.exp.reduce((acc, cur) => acc + cur.value, 0);
        return {
            totalInc,
            totalExp
        }
    }

    function fixObjectExpense() {
        let newExpense = data.items.exp.map(cur => new Expense(cur.id, cur.description, cur.value));
        data.items.exp = newExpense;
    }

    let data = {
        items: {
            inc: [],
            exp: []
        },
        budget: 0,
        totals: {
            inc: 0,
            exp: 0
        },
        percentages: []
    }
    return {
        getData: () => data,
        setDataFromLS: (newData) => {
            data = newData;
        },
        addNewItem: (type, des, val) => {
            //Generate id
            let ID = 0;

            if (data.items[type].length > 0)
                ID = data.items[type][data.items[type].length - 1].id + 1;

            let item;
            if (type === 'inc') {
                item = new Income(ID, des, val);
            } else {
                item = new Expense(ID, des, val);
            }

            //Add item to data structure
            data.items[type].push(item);

            return item;
        },
        calculateBudget: () => {
            //Get total inc & exp
            const total = calculateTotal();
            //Calc total budget
            const budget = total.totalInc - total.totalExp;
            //Update total budget in data structure
            data.totals.inc = total.totalInc;
            data.totals.exp = total.totalExp;
            data.budget = budget;
        },
        getTotalBudget: function () {
            return {
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                totalBudget: data.budget
            }
        },
        deleteItem: (id, type) => {
            const index = data.items[type].findIndex(cur => cur.id == id);
            data.items[type].splice(index, 1);
        },
        calcPercentages: () => {
            //Calculate percentages
            data.items.exp.forEach(cur => {
                cur.calculatePercentage();
            });
            //Store percentages
            data.percentages = data.items.exp.map(cur => cur.percentage);
        },
        getPercentages: () => data.percentages,
        fixObjectExpense
    }
}());


/**
 * UI CONTROLLER
 */
const UIController = (function () {
    const DOM = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    }

    function nodeListForEach(nodeList, callback) {
        for (let i = 0; i < nodeList.length; i++) {
            callback(nodeList[i], i);
        }
    }

    function formatCurrency(num, type = 'inc') {
        let numIng = num.toFixed(2).toString().split('.');
        let dec = numIng[1];
        let int = numIng[0];
        function helper(int) {
            if (int.length <= 3) return int;
            return helper(int.slice(0, int.length - 3)).concat(',' + int.slice(int.length - 3));
        }

        if (type === 'inc') {
            return `+ ${int}.${dec}`;
        } else if (type === 'exp') {
            return `- ${int}.${dec}`;
        } else if (type === 'noType') {
            if (num >= 0) {
                return `+ ${int}.${dec}`;
            } else if (num < 0) {
                return `- ${int * (-1)}.${dec}`;
            }
        }
    }

    function displayNewItem(item, type) {
        let markup;
        if (type === 'inc') {
            markup = `
           <div class="item clearfix" id="inc-${item.id}">
            <div class="item__description">${item.description}</div>
            <div class="right clearfix">
               <div class="item__value">${formatCurrency(item.value)}</div>
               <div class="item__delete">
                   <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
               </div>
           </div>
           </div>
           `;

            document.querySelector(DOM.incomeContainer).insertAdjacentHTML('beforeend', markup);
        } else {
            markup = `
           <div class="item clearfix" id="exp-${item.id}">
           <div class="item__description">${item.description}</div>
           <div class="right clearfix">
               <div class="item__value">${formatCurrency(item.value, 'exp')}</div>
               <div class="item__percentage">21%</div>
               <div class="item__delete">
                   <button class="item__delete--btn"><i class="fa fa-times-circle"></i></i></button>
               </div>
           </div>
           </div>
           `;

            document.querySelector(DOM.expenseContainer).insertAdjacentHTML('beforeend', markup);
        }
    }

    function displayBudget (total) {
        document.querySelector(DOM.budgetLabel).innerText = formatCurrency(total.totalBudget, 'noType');
        document.querySelector(DOM.incomeLabel).innerText = formatCurrency(total.totalInc);
        document.querySelector(DOM.expenseLabel).innerText = formatCurrency(total.totalExp, 'exp');

        if (total.totalInc == 0 || total.totalExp == 0) {
            document.querySelector(DOM.percentageLabel).innerText = '---';
        } else {
            document.querySelector(DOM.percentageLabel).innerText = `${Math.round((total.totalExp / total.totalInc) * 100)}%`;
        }
    }

    function displayPercentages (percentages) {
        let percNodeList = document.querySelectorAll(DOM.expensesPercLabel);

        nodeListForEach(percNodeList, function (cur, i) {
            if (percentages[i] > -1) {
                cur.innerText = `${percentages[i]}%`;
            } else {
                cur.innerText = '---';
            }
        });
    }

    return {
        getDOM: () => DOM,
        getItem: function () {
            return {
                type: document.querySelector(DOM.inputType).value,
                des: document.querySelector(DOM.inputDescription).value,
                val: parseFloat(document.querySelector(DOM.inputValue).value)
            }
        },
        displayNewItem,
        clearFields: () => {
            document.querySelector(DOM.inputDescription).value = '',
                document.querySelector(DOM.inputValue).value = ''

            document.querySelector(DOM.inputDescription).focus();
        },
        displayBudget,
        removeItem: (item) => {
            item.parentElement.removeChild(item);
        },
        displayPercentages,
        displayMonth: () => {
            const date = new Date();
            const day = date.getDate();
            const month = date.getMonth();
            const year = date.getFullYear();

            document.querySelector(DOM.dateLabel).innerText = `${day} / ${month + 1} / ${year}`;
        },
        changeType: () => {
            document.querySelector(DOM.inputType).classList.toggle('red-focus');
            document.querySelector(DOM.inputValue).classList.toggle('red-focus');
            document.querySelector(DOM.inputDescription).classList.toggle('red-focus');
            document.querySelector(DOM.inputBtn).classList.toggle('red');
        },
        displayDataFromLS: (data) => {
            //Display each item
                data.items['inc'].forEach(cur => displayNewItem(cur, 'inc'));
                data.items['exp'].forEach(cur => displayNewItem(cur, 'exp'));
            //Display budget
                displayBudget({
                    totalInc: data.totals.inc,
                    totalExp: data.totals.exp,
                    totalBudget: data.budget
                });
            //Display Percentages
                displayPercentages(data.percentages);
        }
    }
}());


/**
 * APP CONTROLLER
 */
const controller = (function (budgetCtrl, UICtrl, LSCtrl) {
    const DOM = UICtrl.getDOM();

    //Setup event handler
    function setupEventHandler() {
        //Add item event
        document.querySelector(DOM.inputBtn).addEventListener('click', addNewItem);
        window.addEventListener('keypress', (e) => {
            if (e.keyCode === 13 || e.which === 13) addNewItem();
        });

        //Delete item event
        document.querySelector(DOM.container).addEventListener('click', deleteItem);

        //Change type
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
    }

    function addNewItem() {
        //Get input from UI
        const item = UICtrl.getItem();
        if (item.des !== '' && item.val !== '' && item.val > 0) {
            //Add new item to our data structure
            const updatedItem = budgetCtrl.addNewItem(item.type, item.des, item.val);
            //Add new item in UI
            UICtrl.displayNewItem(updatedItem, item.type);
            //Clear fields input in UI
            UICtrl.clearFields();
            //Calculate and update budget
            updateBudget();
            updatePercentages();

            //Get data & store in local stage
            let data = budgetCtrl.getData();
            LSCtrl.addData(data);
        }
    }

    function updateBudget() {
        //Calculate budget
        budgetCtrl.calculateBudget();
        //Get total budget
        const total = budgetCtrl.getTotalBudget();
        //Display budget in UI
        UICtrl.displayBudget(total);
    }

    function deleteItem(e) {
        if (e.target.parentNode.parentNode.parentNode.parentNode.matches('.item')) {
            const item = e.target.parentNode.parentNode.parentNode.parentNode;
            let idArr = item.getAttribute('id').split('-');
            const id = idArr[1];
            const type = idArr[0];

            //Delete item in data structure
            budgetCtrl.deleteItem(id, type);
            //Delete item in UI
            UICtrl.removeItem(item);
            //Update budget;
            updateBudget();
            updatePercentages();

            //Get data & store in local stage
            let data = budgetCtrl.getData();
            LSCtrl.addData(data);
        }
    }

    function updatePercentages() {
        //Calculate Percentages in our data structure
        budgetCtrl.calcPercentages();
        //Get percentages form data structure
        const percentages = budgetCtrl.getPercentages();
        //Update percentages in UI
        UICtrl.displayPercentages(percentages);
    }

    //Get data from local storage and display on UI
    function setupFromLS() {
        //Get data from local storage
        let data = LSCtrl.getData();
        if (data) {
            //Set data in our data structure
            budgetCtrl.setDataFromLS(data);
            //Fix object Expense in data structure
            budgetCtrl.fixObjectExpense();
            //Display on UI
            let updatedData = budgetCtrl.getData();
            UICtrl.displayDataFromLS(updatedData);
        }
    }

    return {
        init: () => {
            setupEventHandler();
            UICtrl.displayMonth();
            setupFromLS();
        }
    }
}(budgetController, UIController, LSController));

controller.init();
