#ifndef NODE_H
#define NODE_H

#include <memory>

using namespace std;

struct node
{
    node(const std::string& g_data)
    {
        data = g_data;
    }
    ~node() = default;

    std::string data;//the token data i.e. ..., -1, 0, 1, ...
    std::shared_ptr<node> left = nullptr;//The left expression of the token
    std::shared_ptr<node> right = nullptr;//the right expression of the token
};

#endif
