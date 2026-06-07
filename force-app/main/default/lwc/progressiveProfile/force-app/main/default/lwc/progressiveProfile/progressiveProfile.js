import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getTabConfigs 
    from '@salesforce/apex/profile.getTabConfigs';
import saveProfileData 
    from '@salesforce/apex/profile.saveProfileData';

export default class ProgressiveProfile 
    extends LightningElement {

    @api recordId;
    @track tabs = [];
    @track currentTabIndex = 0;
    @track formData = {};

    @wire(getTabConfigs)
    wiredTabs({ data, error }) {
        if (data && data.length > 0) {
            this.tabs = data.map((record, index) => ({
                label: record.tab_label__c,
                order: record.tab_order__c,
                fields: record.field_json__c
                    ? JSON.parse(record.field_json__c)
                    : [],
                variant: index === 0 ? 'brand' : 'neutral'
            }));
        } else if (error) {
            console.error('Error:', JSON.stringify(error));
        }
    }

    get currentFields() {
        if (this.tabs.length === 0) return [];
        return this.tabs[this.currentTabIndex].fields
            .map(fieldName => ({
                name: fieldName,
                label: this.formatLabel(fieldName),
                value: this.formData[fieldName] || ''
            }));
    }

    get currentStepNumber() {
        return this.currentTabIndex + 1;
    }

    get totalSteps() {
        return this.tabs.length;
    }

    get showPrevious() {
        return this.currentTabIndex > 0;
    }

    get showNext() {
        return this.currentTabIndex < this.tabs.length - 1;
    }

    get showSubmit() {
        return this.currentTabIndex === this.tabs.length - 1;
    }

    formatLabel(apiName) {
        return apiName
            .replace(/__c$/g, '')
            .replace(/([A-Z])/g, ' $1')
            .trim();
    }

    handleFieldChange(event) {
        const fieldName = event.target.dataset.field;
        const fieldValue = event.target.value;
        if (fieldName !== undefined) {
            this.formData = {
                ...this.formData,
                [fieldName]: fieldValue
            };
        }
    }

    // THIS IS THE KEY FIX
    // Collects ALL current values fresh from screen
    // before checking — so nothing is missed!
    collectCurrentTabValues() {
        const allInputs = this.template
            .querySelectorAll('lightning-input');
        allInputs.forEach(input => {
            const fieldName = input.dataset.field;
            if (fieldName) {
                this.formData = {
                    ...this.formData,
                    [fieldName]: input.value || ''
                };
            }
        });
    }

    validateCurrentTab() {
        // First collect fresh values from screen
        this.collectCurrentTabValues();

        const allInputs = this.template
            .querySelectorAll('lightning-input');
        let allValid = true;

        allInputs.forEach(input => {
            if (!input.value || 
                input.value.trim() === '') {
                input.setCustomValidity(
                    'This field is required!'
                );
                input.reportValidity();
                allValid = false;
            } else {
                input.setCustomValidity('');
                input.reportValidity();
            }
        });

        return allValid;
    }

    validateAllTabs() {
        let allValid = true;
        let firstEmptyTab = -1;
        let emptyFields = [];

        this.tabs.forEach((tab, tabIndex) => {
            tab.fields.forEach(fieldName => {
                const value = this.formData[fieldName];
                const isEmpty = value === undefined ||
                    value === null ||
                    String(value).trim() === '';

                if (isEmpty) {
                    allValid = false;
                    if (firstEmptyTab === -1) {
                        firstEmptyTab = tabIndex;
                    }
                    emptyFields.push(
                        this.formatLabel(fieldName)
                    );
                }
            });
        });

        if (!allValid) {
            this.currentTabIndex = firstEmptyTab;
            this.updateTabStyles();
            this.dispatchEvent(new ShowToastEvent({
                title: 'Please fill all fields!',
                message: 'Empty: ' + emptyFields.join(', '),
                variant: 'warning',
                mode: 'sticky'
            }));
        }

        return allValid;
    }

    goToNext() {
        const isValid = this.validateCurrentTab();
        if (!isValid) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Fields are empty!',
                message: 'Fill all fields in this tab!',
                variant: 'warning'
            }));
            return;
        }
        this.currentTabIndex++;
        this.updateTabStyles();
    }

    goToPrevious() {
        // Collect values before going back
        this.collectCurrentTabValues();
        this.currentTabIndex--;
        this.updateTabStyles();
    }

    goToTab(event) {
        const clickedIndex = parseInt(
            event.target.dataset.index, 10
        );
        if (clickedIndex > this.currentTabIndex) {
            const isValid = this.validateCurrentTab();
            if (!isValid) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Fields are empty!',
                    message: 'Fill all fields first!',
                    variant: 'warning'
                }));
                return;
            }
        } else {
            // Going back — just collect values
            this.collectCurrentTabValues();
        }
        this.currentTabIndex = clickedIndex;
        this.updateTabStyles();
    }

    updateTabStyles() {
        this.tabs = this.tabs.map((tab, index) => ({
            ...tab,
            variant: index === this.currentTabIndex
                ? 'brand' : 'neutral'
        }));
    }

    async handleSubmit() {
        // Step 1 — collect ALL values from last tab
        this.collectCurrentTabValues();

        // Step 2 — validate last tab on screen
        const currentValid = this.validateCurrentTab();
        if (!currentValid) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Fields are empty!',
                message: 'Fill all fields before submitting!',
                variant: 'warning'
            }));
            return;
        }

        // Step 3 — validate ALL tabs
        const allValid = this.validateAllTabs();
        if (!allValid) return;

        // Step 4 — Save!
        try {
            await saveProfileData({
                recordId: this.recordId,
                fieldValues: this.formData
            });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Profile Saved! 🎉',
                message: 'All details saved successfully!',
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error saving',
                message: error.body.message,
                variant: 'error'
            }));
        }
    }
}
