#ifndef  TOPOSTFIX_H
#define  TOPOSTFIX_H

#include<vector>
#include<string>
#include<iostream>


//shunting yard
class toPostFix
{
public:
    toPostFix(const std::vector<std::string>& givenInFixExpression);

    ~toPostFix() = default;

    const std::vector<std::string>& getPostFixExpression();


private:
    std::vector<std::string> inFixExpression;

    std::vector<std::string> postFixExpression;

    std::vector<std::string> operatorStack;
};



#endif

