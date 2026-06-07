public with sharing class profile {

    @AuraEnabled(cacheable=true)
    public static List<Progressive_Profile__mdt> getTabConfigs() {
        return [
            SELECT tab_label__c, tab_order__c, field_json__c
            FROM Progressive_Profile__mdt
            WHERE is_active__c = true
            ORDER BY tab_order__c ASC
        ];
    }

    @AuraEnabled
    public static void saveProfileData(
            Id recordId, 
            Map<String, Object> fieldValues) {
        try {
            Contact con = new Contact(Id = recordId);

            // Get all valid fields on Contact object
            Map<String, Schema.SObjectField> contactFields =
                Schema.SObjectType.Contact.fields.getMap();

            for (String fieldName : fieldValues.keySet()) {
                
                // Convert field name to lowercase for comparison
                String fieldNameLower = fieldName.toLowerCase();
                
                // Check if this field actually exists on Contact
                if (contactFields.containsKey(fieldNameLower)) {
                    
                    Object val = fieldValues.get(fieldName);
                    
                    // Only save if value is not empty
                    if (val != null && 
                        String.valueOf(val).trim() != '') {
                        con.put(fieldName, 
                            String.valueOf(val));
                    }
                }
                // If field doesn't exist — just skip it
                // No crash!
            }
            
            update con;

        } catch (DmlException e) {
            throw new AuraHandledException(
                'Save failed: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException(
                'Error: ' + e.getMessage());
        }
    }
}
