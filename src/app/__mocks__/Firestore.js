export default {
    storage: {
        ref() {
            return {
                put() {
                    return Promise.resolve({
                        ref: {
                            getDownloadURL() {
                                return "testURL"
                            }
                        },fileName: "text.png"
                    
                        
                    });
                }
            }
        }
    }
}