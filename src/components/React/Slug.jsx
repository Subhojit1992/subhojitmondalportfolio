import React, { useState } from 'react';
import { Card, Row, Col, Input, Form, Segmented, Button, Divider, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import slugify from 'react-slugify';

const Slug = () => {
    const segmentedValues = ['Separate with dash (-)', 'Separate with underscore (_)'];
    const [sourceText, setSourceText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [separate, setSeparate] = useState('Separate with dash (-)');
    const [prefix, setPrefix] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    const generateSlug = () => {
        // alert(slugify(sourceText));
        setOutputText(
            slugify(sourceText, {
                delimiter: separate === segmentedValues[0] ? '-' : '_',
                prefix: prefix
            })
        );
    };

    const clearInput = () => {
        setSourceText('');
        setOutputText('');
    };

    const handleCopy = () => {
        navigator.clipboard
            .writeText(outputText)
            .then(() => {
                messageApi.open({
                    type: 'success',
                    content: `Slug copied to clipboard.`
                });
            })
            .catch((error) => {
                messageApi.open({
                    type: 'error',
                    content: `Slug copy failed!`
                });
            });
    };

    return (
        <div>
            {contextHolder}
            <Card title="INPUT STRING: (Article title, tutorial title or any web page title)">
                <Row>
                    <Col span={24}>
                        <Input size="large" onChange={(e) => setSourceText(e.target.value)} allowClear onClear={() => clearInput()} />
                    </Col>
                </Row>
                <br />
                <Row gutter={16}>
                    <Col span={18}>
                        <Segmented options={segmentedValues} block value={separate} onChange={setSeparate} />
                    </Col>
                    <Col span={6}>
                        <Input placeholder="Any prefix?" value={prefix} onChange={(e) => setPrefix(e.target.value)} allowClear onClear={() => setPrefix('')} />
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col span={24}>
                        <Button size="large" type="primary" block onClick={() => generateSlug()}>
                            Slug Constructor - Generate Easy-To-Read Slugs
                        </Button>
                    </Col>
                </Row>
                {outputText.length > 0 && (
                    <>
                        <Divider />
                        <Row>
                            <Col span={24}>
                                <div>
                                    <pre className="slug-output">{outputText}</pre>
                                    <div
                                        onClick={() => handleCopy()}
                                        className="flex justify-center gap-2 bg-blue-600 p-3 text-white rounded-br-md rounded-bl-md cursor-pointer hover:bg-blue-400"
                                    >
                                        <CopyOutlined />
                                        <span>Copy Slug Value</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </>
                )}
            </Card>
        </div>
    );
};

export default Slug;
